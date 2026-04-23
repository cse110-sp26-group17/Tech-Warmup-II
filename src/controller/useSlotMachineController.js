import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameState from '../state/GameState';
import {
  MACHINE_EVENTS,
  MACHINE_STATES,
  SYMBOL_DISPLAY,
  WIN_TIERS,
  createNearMissHint,
  getFeedbackLabel,
  getPayoutDuration,
  getSpinProfile,
  getWinTier,
  transitionMachineState,
} from '../animations/reelAnimation';
import {
  playBalanceCountSound,
  playLossSound,
  playMilestoneSound,
  playSpinSound,
  playStopSound,
  playWinSound,
} from '../audio/soundHooks';
import { formatCredits } from '../utils/formatCredits';

const BET_OPTIONS = Object.freeze([5, 10, 25, 50, 100]);
const RESULT_POPUP_DURATION_MS = 3600;
const MILESTONE_POPUP_DURATION_MS = 1200;
const SAVE_STORAGE_KEY = 'slot-machine-save-v2';

const STATUS_MESSAGES = Object.freeze({
  READY: 'Set your bet and spin',
  INITIAL: 'Set your bet, then spin',
  SPINNING: 'Spinning reels...',
  TURBO_SPINNING: 'Turbo spin in progress...',
  LUCK_BUILDING: 'Luck is building...',
  BALANCE_TOO_LOW: 'Balance too low for that bet',
  AUTO_SPIN_STOPPED: 'Auto-spin stopped',
  AUTO_SPIN_STOPPED_LOW_BALANCE: 'Auto-spin stopped: insufficient balance',
  FREE_ROLL_USED: 'FREE ROLL USED',
  DUE_FOR_WIN: 'DUE FOR A WIN',
  RESULT_READY: 'Ready for your next spin',
  RESET: 'Game reset. Place your bet.',
});

const FREE_ROLL_LABELS = Object.freeze({
  milestone: 'Milestone Free Roll',
  consolation: 'Consolation Free Roll',
  random: 'Lucky Free Roll',
});

/**
 * Returns the highest affordable bet from BET_OPTIONS, preserving the current bet if still valid.
 * @param {number} balance - Current credit balance.
 * @param {number} currentBet - Currently selected bet amount.
 * @returns {number} A valid bet amount from BET_OPTIONS.
 */
function pickValidBet(balance, currentBet) {
  const affordableOptions = BET_OPTIONS.filter((option) => option <= balance);
  if (affordableOptions.length === 0) {
    return BET_OPTIONS[0];
  }
  if (affordableOptions.includes(currentBet)) {
    return currentBet;
  }
  return affordableOptions[affordableOptions.length - 1];
}

/**
 * Parses a JSON string, returning null instead of throwing on invalid input.
 * @param {string | null} jsonText - JSON string to parse.
 * @returns {*} Parsed value, or null if parsing fails.
 */
function safeParse(jsonText) {
  if (typeof jsonText !== 'string') {
    return null;
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

/**
 * Returns true when a spin can begin.
 * @param {{machineState: string, controlsLocked: boolean, spinLocked: boolean}} options
 * @returns {boolean}
 */
export function canStartSpin({ machineState, controlsLocked, spinLocked }) {
  return machineState === MACHINE_STATES.IDLE && !controlsLocked && !spinLocked;
}

/**
 * Returns a pre-check error message for an attempted spin, or null when valid.
 * @param {{balance: number, betAmount: number, freeRolls: number}} options
 * @returns {string | null}
 */
export function getSpinPrecheckError({ balance, betAmount, freeRolls }) {
  const hasFreeRoll = freeRolls > 0;
  if (hasFreeRoll) {
    return null;
  }

  if (balance < 1 || betAmount > balance) {
    return STATUS_MESSAGES.BALANCE_TOO_LOW;
  }

  return null;
}

/**
 * Returns the status line text shown when a spin starts.
 * @param {{lossStreak: number, turboMode: boolean}} options
 * @returns {string}
 */
export function getSpinStartStatusMessage({ lossStreak, turboMode }) {
  if (lossStreak >= 5) {
    return STATUS_MESSAGES.LUCK_BUILDING;
  }

  if (turboMode) {
    return STATUS_MESSAGES.TURBO_SPINNING;
  }

  return STATUS_MESSAGES.SPINNING;
}

/**
 * Returns the status line text shown after result reveal.
 * @param {{usedFreeRoll: boolean, shouldShowDueForWin: boolean, isWin: boolean}} options
 * @returns {string}
 */
export function getPostResultStatusMessage({ usedFreeRoll, shouldShowDueForWin, isWin }) {
  if (usedFreeRoll) {
    return STATUS_MESSAGES.FREE_ROLL_USED;
  }

  if (shouldShowDueForWin && !isWin) {
    return STATUS_MESSAGES.DUE_FOR_WIN;
  }

  return STATUS_MESSAGES.RESULT_READY;
}

function getMilestoneLabel(milestoneType) {
  if (milestoneType === 'major') {
    return '50-Spin Bonus';
  }
  if (milestoneType === 'medium') {
    return '25-Spin Bonus';
  }
  return '10-Spin Bonus';
}

export function useSlotMachineController() {
  const gameStateRef = useRef(new GameState());
  const timeoutIdsRef = useRef([]);
  const winCounterIntervalRef = useRef(null);
  const balanceCounterFrameRef = useRef(null);
  const displayedBalanceRef = useRef(gameStateRef.current.getBalance());
  const hasInitializedBalanceRef = useRef(false);
  const spinLockRef = useRef(false);

  const [balance, setBalance] = useState(gameStateRef.current.getBalance());
  const [displayedBalance, setDisplayedBalance] = useState(gameStateRef.current.getBalance());
  const [isBalanceCounting, setIsBalanceCounting] = useState(false);
  const [betAmount, setBetAmount] = useState(() =>
    pickValidBet(gameStateRef.current.getBalance(), gameStateRef.current.betAmount)
  );
  const [lifetimeWinnings, setLifetimeWinnings] = useState(gameStateRef.current.getLifetimeWinnings());
  const [winLog, setWinLog] = useState(gameStateRef.current.getWinLog());
  const [biggestWin, setBiggestWin] = useState(gameStateRef.current.getBiggestWin());
  const [topWins, setTopWins] = useState(gameStateRef.current.getTopWins());
  const [meta, setMeta] = useState(gameStateRef.current.getMetaState());
  const [isNewBiggestWin, setIsNewBiggestWin] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [displayedWin, setDisplayedWin] = useState(0);
  const [machineState, setMachineState] = useState(MACHINE_STATES.IDLE);
  const [result, setResult] = useState(null);
  const [winTier, setWinTier] = useState(WIN_TIERS.LOSS);
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES.INITIAL);
  const [controlsLocked, setControlsLocked] = useState(false);
  const [reelSymbols, setReelSymbols] = useState(['none', 'none', 'none', 'none', 'none']);
  const [spinToken, setSpinToken] = useState(0);
  const [nearMissHint, setNearMissHint] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turboMode, setTurboMode] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dailyGrantReady, setDailyGrantReady] = useState(true);
  const [dailyGrantAmount] = useState(gameStateRef.current.dailyGrantAmount);
  const [freeRolls, setFreeRolls] = useState(gameStateRef.current.getFreeRollCount());
  const [milestonePopup, setMilestonePopup] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const spinProfile = useMemo(
    () => getSpinProfile({ turboMode, reducedMotion }),
    [turboMode, reducedMotion]
  );

  const symbolPayouts = useMemo(() => {
    const payoutTable = gameStateRef.current.getPayoutTable();
    return Object.entries(payoutTable)
      .filter(([name]) => name !== 'none')
      .map(([name, config]) => ({
        name,
        label: SYMBOL_DISPLAY[name]?.label ?? name,
        emoji: SYMBOL_DISPLAY[name]?.code ?? '?',
        multiplier: config.multiplier,
      }));
  }, []);

  const transitionState = useCallback((eventName) => {
    setMachineState((currentState) => transitionMachineState(currentState, eventName));
  }, []);

  const clearAllTimers = useCallback(() => {
    timeoutIdsRef.current.forEach((timerId) => clearTimeout(timerId));
    timeoutIdsRef.current = [];

    if (winCounterIntervalRef.current) {
      clearInterval(winCounterIntervalRef.current);
      winCounterIntervalRef.current = null;
    }

    if (balanceCounterFrameRef.current) {
      cancelAnimationFrame(balanceCounterFrameRef.current);
      balanceCounterFrameRef.current = null;
    }

    spinLockRef.current = false;
    setIsBalanceCounting(false);
  }, []);

  const syncFromGameState = useCallback(() => {
    const gameState = gameStateRef.current;
    setBalance(gameState.getBalance());
    setBetAmount(pickValidBet(gameState.getBalance(), gameState.betAmount));
    setLifetimeWinnings(gameState.getLifetimeWinnings());
    setWinLog(gameState.getWinLog());
    setBiggestWin(gameState.getBiggestWin());
    setTopWins(gameState.getTopWins());
    setMeta(gameState.getMetaState());
    setRecentResults([...gameState.recentResults]);
    setFreeRolls(gameState.getFreeRollCount());
    setDailyGrantReady(gameState.canClaimDailyGrant());
  }, []);

  const persistState = useCallback(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(gameStateRef.current.getPersistenceState()));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedState = safeParse(window.localStorage.getItem(SAVE_STORAGE_KEY));
      if (!savedState) {
        return;
      }

      gameStateRef.current.hydrateFromState(savedState);
      syncFromGameState();
      setStatusMessage(`Welcome back! Balance: ${formatCredits(gameStateRef.current.getBalance())} VC`);
    } catch {
      setStatusMessage('Could not load saved game state. Continuing with a fresh session.');
    }
  }, [syncFromGameState]);

  useEffect(() => {
    setBetAmount((currentBet) => pickValidBet(balance, currentBet));
  }, [balance]);

  useEffect(() => {
    displayedBalanceRef.current = displayedBalance;
  }, [displayedBalance]);

  useEffect(() => {
    if (!hasInitializedBalanceRef.current) {
      hasInitializedBalanceRef.current = true;
      setDisplayedBalance(balance);
      setIsBalanceCounting(false);
      return;
    }

    if (balanceCounterFrameRef.current) {
      cancelAnimationFrame(balanceCounterFrameRef.current);
      balanceCounterFrameRef.current = null;
    }

    if (reducedMotion || balance <= displayedBalanceRef.current) {
      setDisplayedBalance(balance);
      displayedBalanceRef.current = balance;
      setIsBalanceCounting(false);
      return;
    }

    const startBalance = displayedBalanceRef.current;
    const targetBalance = balance;
    const durationMs = 1200;
    let startTimeMs = 0;

    setIsBalanceCounting(true);
    if (soundEnabled) {
      playBalanceCountSound(durationMs);
    }

    const animateBalance = (timestampMs) => {
      if (startTimeMs === 0) {
        startTimeMs = timestampMs;
      }

      const elapsedMs = timestampMs - startTimeMs;
      const progress = Math.min(1, elapsedMs / durationMs);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(startBalance + (targetBalance - startBalance) * easedProgress);

      setDisplayedBalance(nextValue);
      displayedBalanceRef.current = nextValue;

      if (progress < 1) {
        balanceCounterFrameRef.current = requestAnimationFrame(animateBalance);
      } else {
        balanceCounterFrameRef.current = null;
        setIsBalanceCounting(false);
      }
    };

    balanceCounterFrameRef.current = requestAnimationFrame(animateBalance);

    return () => {
      if (balanceCounterFrameRef.current) {
        cancelAnimationFrame(balanceCounterFrameRef.current);
        balanceCounterFrameRef.current = null;
      }
      setIsBalanceCounting(false);
    };
  }, [balance, reducedMotion, soundEnabled]);

  const startWinCounter = useCallback(
    (targetAmount, durationMs) => {
      if (winCounterIntervalRef.current) {
        clearInterval(winCounterIntervalRef.current);
        winCounterIntervalRef.current = null;
      }

      if (targetAmount <= 0) {
        setDisplayedWin(0);
        return;
      }

      if (reducedMotion) {
        setDisplayedWin(targetAmount);
        return;
      }

      const tickEveryMs = 34;
      const totalSteps = Math.max(1, Math.floor(durationMs / tickEveryMs));
      let currentStep = 0;

      setDisplayedWin(0);
      winCounterIntervalRef.current = setInterval(() => {
        currentStep += 1;
        const progress = Math.min(1, currentStep / totalSteps);
        setDisplayedWin(Math.floor(targetAmount * progress));

        if (progress >= 1) {
          clearInterval(winCounterIntervalRef.current);
          winCounterIntervalRef.current = null;
        }
      }, tickEveryMs);
    },
    [reducedMotion]
  );

  const selectBet = useCallback(
    (nextBet) => {
      if (controlsLocked) {
        return;
      }

      if (!BET_OPTIONS.includes(nextBet)) {
        return;
      }

      if (nextBet > balance) {
        return;
      }

      setBetAmount(nextBet);
    },
    [controlsLocked, balance]
  );

  const spin = useCallback(() => {
    if (!canStartSpin({ machineState, controlsLocked, spinLocked: spinLockRef.current })) {
      return;
    }

    const precheckError = getSpinPrecheckError({ balance, betAmount, freeRolls });
    if (precheckError) {
      setStatusMessage(precheckError);
      setAutoSpin(false);
      return;
    }

    const failSpin = (message) => {
      spinLockRef.current = false;
      setControlsLocked(false);
      transitionState(MACHINE_EVENTS.END_SPIN);
      setStatusMessage(message);
    };

    clearAllTimers();
    spinLockRef.current = true;

    setControlsLocked(true);
    transitionState(MACHINE_EVENTS.START_SPIN);
    setStatusMessage(getSpinStartStatusMessage({ lossStreak: meta.currentLossStreak, turboMode }));
    setDisplayedWin(0);
    setResult(null);
    setResultMessage('');
    setWinTier(WIN_TIERS.LOSS);
    setIsNewBiggestWin(false);
    setMilestonePopup(null);

    const gameState = gameStateRef.current;
    const previousBiggestPayout = gameState.getBiggestWin()?.payout ?? 0;

    try {
      gameState.updateBet(betAmount);
    } catch (error) {
      failSpin(error?.message ?? 'Unable to update bet amount.');
      return;
    }

    let spinResult;
    try {
      spinResult = gameState.spinWithPayout(betAmount);
      persistState();
    } catch (error) {
      failSpin(error?.message ?? 'Unable to spin right now.');
      return;
    }

    const finalSymbols = spinResult.reels.map((reelValue) => gameState.getSymbolName(reelValue));
    const tier = getWinTier(spinResult.result);
    const payoutDurationMs = getPayoutDuration({ tier, turboMode, reducedMotion });
    const nearMiss = createNearMissHint({
      isWin: spinResult.result.isWin,
      finalSymbols,
    });

    const nearMissDelayMs =
      nearMiss && nearMiss.reelIndex === 2 && !reducedMotion ? nearMiss.previewDurationMs : 0;

    const resultRevealDelayMs =
      Math.max(750, spinProfile.totalSpinDuration, ...spinProfile.reelDurations) + nearMissDelayMs + 40;

    setNearMissHint(nearMiss);
    setReelSymbols(finalSymbols);
    setSpinToken((token) => token + 1);

    if (soundEnabled) {
      playSpinSound();
    }

    const resultTimer = setTimeout(() => {
      const isWin = spinResult.result.isWin;
      const feedbackLabel = getFeedbackLabel(tier);
      const totalPayout = spinResult.result.totalPayout;
      const popupMessage = isWin
        ? `${feedbackLabel}! +${formatCredits(totalPayout)} VC`
        : nearMiss?.bannerText ?? 'Better luck next spin';

      const currentBiggest = gameState.getBiggestWin();
      const becameBiggest = isWin && currentBiggest && totalPayout > previousBiggestPayout;

      transitionState(MACHINE_EVENTS.SHOW_RESULT);
      setResult(spinResult.result);
      setResultMessage(popupMessage);
      setWinTier(tier);
      setDisplayedWin(isWin ? totalPayout : 0);
      syncFromGameState();
      setIsNewBiggestWin(Boolean(becameBiggest));

      if (spinResult.result.milestoneBonus > 0) {
        const milestoneLabel = getMilestoneLabel(spinResult.result.milestoneType);
        setMilestonePopup(`${milestoneLabel} +${formatCredits(spinResult.result.milestoneBonus)} VC`);
        const clearMilestoneTimer = setTimeout(() => {
          setMilestonePopup(null);
        }, MILESTONE_POPUP_DURATION_MS);
        timeoutIdsRef.current.push(clearMilestoneTimer);

        if (soundEnabled) {
          playMilestoneSound();
        }
      }

      if (spinResult.freeRollAwarded) {
        const freeRollLabel = FREE_ROLL_LABELS[spinResult.freeRollAwarded] ?? 'Free Roll';
        setMilestonePopup(`${freeRollLabel} Unlocked`);

        const clearFreeRollTimer = setTimeout(() => {
          setMilestonePopup(null);
        }, MILESTONE_POPUP_DURATION_MS);
        timeoutIdsRef.current.push(clearFreeRollTimer);
      }

      if (!isWin && soundEnabled) {
        playLossSound();
      }

      setStatusMessage(
        getPostResultStatusMessage({
          usedFreeRoll: spinResult.result.usedFreeRoll,
          shouldShowDueForWin: spinResult.shouldShowDueForWin,
          isWin,
        })
      );
    }, resultRevealDelayMs);

    const payoutTimer = setTimeout(() => {
      transitionState(MACHINE_EVENTS.START_PAYOUT);

      if (!spinResult.result.isWin) {
        return;
      }

      if (soundEnabled) {
        playWinSound(tier);
      }

      startWinCounter(spinResult.result.totalPayout, payoutDurationMs);
    }, resultRevealDelayMs + RESULT_POPUP_DURATION_MS);

    const idleTimer = setTimeout(() => {
      spinLockRef.current = false;
      transitionState(MACHINE_EVENTS.END_SPIN);
      setControlsLocked(false);
      setNearMissHint(null);
      setStatusMessage(STATUS_MESSAGES.READY);
      setIsNewBiggestWin(false);
      setDisplayedWin(spinResult.result.isWin ? spinResult.result.totalPayout : 0);
    }, resultRevealDelayMs + RESULT_POPUP_DURATION_MS + payoutDurationMs);

    timeoutIdsRef.current.push(resultTimer, payoutTimer, idleTimer);
  }, [
    machineState,
    controlsLocked,
    balance,
    freeRolls,
    betAmount,
    clearAllTimers,
    turboMode,
    soundEnabled,
    reducedMotion,
    spinProfile,
    startWinCounter,
    meta.currentLossStreak,
    syncFromGameState,
    transitionState,
    persistState,
  ]);

  const claimDailyGrant = useCallback(() => {
    const gameState = gameStateRef.current;

    try {
      const grantResult = gameState.claimDailyGrant();
      persistState();
      syncFromGameState();
      setStatusMessage(`Daily grant claimed: +${formatCredits(grantResult.amount)} VC`);
    } catch (error) {
      setDailyGrantReady(false);
      setStatusMessage(error?.message ?? 'Unable to claim daily grant right now.');
    }
  }, [persistState, syncFromGameState]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    gameStateRef.current.resetGame();
    persistState();
    syncFromGameState();

    spinLockRef.current = false;
    setResultMessage('');
    setDisplayedWin(0);
    transitionState(MACHINE_EVENTS.RESET);
    setResult(null);
    setWinTier(WIN_TIERS.LOSS);
    setStatusMessage(STATUS_MESSAGES.RESET);
    setControlsLocked(false);
    setReelSymbols(['none', 'none', 'none', 'none', 'none']);
    setNearMissHint(null);
    setAutoSpin(false);
    setMilestonePopup(null);
  }, [clearAllTimers, persistState, syncFromGameState, transitionState]);

  const stopAutoSpin = useCallback(() => {
    setAutoSpin(false);
    setStatusMessage(STATUS_MESSAGES.AUTO_SPIN_STOPPED);
  }, []);

  useEffect(() => {
    if (!autoSpin || controlsLocked || machineState !== MACHINE_STATES.IDLE || spinLockRef.current) {
      return;
    }

    if (freeRolls < 1 && (balance < 1 || betAmount > balance)) {
      setAutoSpin(false);
      setStatusMessage(STATUS_MESSAGES.AUTO_SPIN_STOPPED_LOW_BALANCE);
      return;
    }

    const autoSpinTimer = setTimeout(
      () => {
        spin();
      },
      turboMode ? 80 : 180
    );

    return () => clearTimeout(autoSpinTimer);
  }, [autoSpin, controlsLocked, machineState, balance, betAmount, spin, turboMode, freeRolls]);

  const onReelStop = useCallback(() => {
    if (soundEnabled) {
      playStopSound();
    }
  }, [soundEnabled]);

  return {
    balance,
    displayedBalance,
    isBalanceCounting,
    betAmount,
    betOptions: BET_OPTIONS,
    netGain: lifetimeWinnings,
    winLog,
    biggestWin,
    topWins,
    meta,
    recentResults,
    isNewBiggestWin,
    milestonePopup,
    dailyGrantAmount,
    dailyGrantReady,
    freeRolls,
    resultMessage,
    displayedWin,
    machineState,
    result,
    winTier,
    statusMessage,
    controlsLocked,
    reelSymbols,
    spinToken,
    nearMissHint,
    soundEnabled,
    turboMode,
    autoSpin,
    settingsOpen,
    reducedMotion,
    spinProfile,
    symbolPayouts,
    spin,
    resetGame,
    claimDailyGrant,
    selectBet,
    onReelStop,
    setTurboMode,
    setAutoSpin,
    stopAutoSpin,
    setSettingsOpen,
    setSoundEnabled,
    setReducedMotion,
  };
}
