import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameState from '../state/GameState';
import {
  MACHINE_STATES,
  SYMBOL_DISPLAY,
  WIN_TIERS,
  createNearMissHint,
  getFeedbackLabel,
  getPayoutDuration,
  getSpinProfile,
  getWinTier,
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
const RESULT_POPUP_DURATION_MS = 1600 + 2000;
const MILESTONE_POPUP_DURATION_MS = 1200;
const SAVE_STORAGE_KEY = 'slot-machine-save-v2';

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
 * @param {string} jsonText - JSON string to parse.
 * @returns {*} Parsed value, or null if parsing fails.
 */
function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export function useSlotMachineController() {
  const gameStateRef = useRef(new GameState());
  const timeoutIdsRef = useRef([]);
  const winCounterIntervalRef = useRef(null);
  const balanceCounterFrameRef = useRef(null);
  const displayedBalanceRef = useRef(gameStateRef.current.getBalance());
  const hasInitializedBalanceRef = useRef(false);

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
  const [statusMessage, setStatusMessage] = useState('Set your bet, then spin');
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

  const clearAllTimers = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];

    if (winCounterIntervalRef.current) {
      clearInterval(winCounterIntervalRef.current);
      winCounterIntervalRef.current = null;
    }
    if (balanceCounterFrameRef.current) {
      cancelAnimationFrame(balanceCounterFrameRef.current);
      balanceCounterFrameRef.current = null;
    }
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
      return;
    }
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(gameStateRef.current.getPersistenceState()));
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const saved = safeParse(window.localStorage.getItem(SAVE_STORAGE_KEY));
    if (saved) {
      gameStateRef.current.hydrateFromState(saved);
      syncFromGameState();
      setStatusMessage(`Welcome back! Balance: ${formatCredits(gameStateRef.current.getBalance())} VC`);
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
    const duration = 1200;
    let startTime = 0;

    setIsBalanceCounting(true);
    if (soundEnabled) {
      playBalanceCountSound(duration);
    }

    const animateBalance = (timestamp) => {
      if (startTime === 0) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(startBalance + (targetBalance - startBalance) * eased);

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
    (targetAmount, duration) => {
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
      const steps = Math.max(1, Math.floor(duration / tickEveryMs));
      let currentStep = 0;

      setDisplayedWin(0);
      winCounterIntervalRef.current = setInterval(() => {
        currentStep += 1;
        const progress = Math.min(1, currentStep / steps);
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
    if (machineState !== MACHINE_STATES.IDLE || controlsLocked) {
      return;
    }

    if (balance < 1 && freeRolls < 1) {
      setStatusMessage('Balance too low for that bet');
      setAutoSpin(false);
      return;
    }

    if (betAmount > balance && freeRolls < 1) {
      setStatusMessage('Balance too low for that bet');
      setAutoSpin(false);
      return;
    }

    clearAllTimers();
    setControlsLocked(true);
    setMachineState(MACHINE_STATES.SPINNING);
    setStatusMessage(
      meta.currentLossStreak >= 5
        ? 'Luck is building...'
        : turboMode
          ? 'Turbo spin in progress...'
          : 'Spinning reels...'
    );
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
      setControlsLocked(false);
      setMachineState(MACHINE_STATES.IDLE);
      setStatusMessage(error.message);
      return;
    }

    let spinResult;
    try {
      spinResult = gameState.spinWithPayout(betAmount);
      persistState();
    } catch (error) {
      setControlsLocked(false);
      setMachineState(MACHINE_STATES.IDLE);
      setStatusMessage(error.message);
      return;
    }

    const finalSymbols = spinResult.reels.map((reelValue) => gameState.getSymbolName(reelValue));
    const tier = getWinTier(spinResult.result);
    const payoutDuration = getPayoutDuration({ tier, turboMode, reducedMotion });
    const nearMiss = createNearMissHint({
      isWin: spinResult.result.isWin,
      finalSymbols,
    });

    const nearMissDelay =
      nearMiss && nearMiss.reelIndex === 2 && !reducedMotion ? nearMiss.previewDurationMs : 0;
    const resultRevealDelay =
      Math.max(750, spinProfile.totalSpinDuration, ...spinProfile.reelDurations) + nearMissDelay + 40;

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

      setMachineState(MACHINE_STATES.RESULT);
      setResult(spinResult.result);
      setResultMessage(popupMessage);
      setWinTier(tier);
      setDisplayedWin(isWin ? totalPayout : 0);
      syncFromGameState();
      setIsNewBiggestWin(Boolean(becameBiggest));

      if (spinResult.result.milestoneBonus > 0) {
        const milestoneLabel =
          spinResult.result.milestoneType === 'major'
            ? '50-Spin Bonus'
            : spinResult.result.milestoneType === 'medium'
              ? '25-Spin Bonus'
              : '10-Spin Bonus';
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
        const labelMap = {
          milestone: 'Milestone Free Roll',
          consolation: 'Consolation Free Roll',
          random: 'Lucky Free Roll',
        };
        setMilestonePopup(`${labelMap[spinResult.freeRollAwarded] ?? 'Free Roll'} Unlocked`);
        const clearFreeRollTimer = setTimeout(() => {
          setMilestonePopup(null);
        }, MILESTONE_POPUP_DURATION_MS);
        timeoutIdsRef.current.push(clearFreeRollTimer);
      }

      if (!isWin && soundEnabled) {
        playLossSound();
      }

      if (spinResult.result.usedFreeRoll) {
        setStatusMessage('FREE ROLL USED');
      } else if (spinResult.shouldShowDueForWin && !isWin) {
        setStatusMessage('DUE FOR A WIN');
      } else {
        setStatusMessage('Ready for your next spin');
      }
    }, resultRevealDelay);

    const payoutTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.PAYOUT);
      if (spinResult.result.isWin) {
        if (soundEnabled) {
          playWinSound(tier);
        }
        startWinCounter(spinResult.result.totalPayout, payoutDuration);
      }
    }, resultRevealDelay + RESULT_POPUP_DURATION_MS);

    const idleTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.IDLE);
      setControlsLocked(false);
      setNearMissHint(null);
      setStatusMessage('Set your bet and spin');
      setIsNewBiggestWin(false);
      if (spinResult.result.isWin) {
        setDisplayedWin(spinResult.result.totalPayout);
      } else {
        setDisplayedWin(0);
      }
    }, resultRevealDelay + RESULT_POPUP_DURATION_MS + payoutDuration);

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
      setStatusMessage(error.message);
    }
  }, [persistState, syncFromGameState]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    gameStateRef.current.resetGame();
    persistState();
    syncFromGameState();

    setResultMessage('');
    setDisplayedWin(0);
    setMachineState(MACHINE_STATES.IDLE);
    setResult(null);
    setWinTier(WIN_TIERS.LOSS);
    setStatusMessage('Game reset. Place your bet.');
    setControlsLocked(false);
    setReelSymbols(['none', 'none', 'none', 'none', 'none']);
    setNearMissHint(null);
    setAutoSpin(false);
    setMilestonePopup(null);
  }, [clearAllTimers, persistState, syncFromGameState]);

  const stopAutoSpin = useCallback(() => {
    setAutoSpin(false);
    setStatusMessage('Auto-spin stopped');
  }, []);

  useEffect(() => {
    if (!autoSpin || controlsLocked || machineState !== MACHINE_STATES.IDLE) {
      return;
    }

    if (freeRolls < 1 && (balance < 1 || betAmount > balance)) {
      setAutoSpin(false);
      setStatusMessage('Auto-spin stopped: insufficient balance');
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
