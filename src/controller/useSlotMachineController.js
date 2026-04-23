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
import { playSpinSound, playStopSound, playWinSound } from '../audio/soundHooks';

const BET_OPTIONS = Object.freeze([5, 10, 25, 50, 100]);
const RESULT_POPUP_DURATION_MS = 2500;
const DAILY_GRANT_STORAGE_KEY = 'slot-machine-daily-grant-date';

function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Picks a valid fixed-option bet for the current balance.
 *
 * @param {number} balance - Current player balance.
 * @param {number} currentBet - Current selected bet.
 * @returns {number} Safe bet amount.
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

export function useSlotMachineController() {
  const gameStateRef = useRef(new GameState());
  const timeoutIdsRef = useRef([]);
  const winCounterIntervalRef = useRef(null);

  const [balance, setBalance] = useState(gameStateRef.current.getBalance());
  const [betAmount, setBetAmount] = useState(() =>
    pickValidBet(gameStateRef.current.getBalance(), gameStateRef.current.betAmount)
  );
  const [lifetimeWinnings, setLifetimeWinnings] = useState(gameStateRef.current.getLifetimeWinnings());
  const [winLog, setWinLog] = useState(gameStateRef.current.getWinLog());
  const [biggestWin, setBiggestWin] = useState(gameStateRef.current.getBiggestWin());
  const [isNewBiggestWin, setIsNewBiggestWin] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [displayedWin, setDisplayedWin] = useState(0);
  const [machineState, setMachineState] = useState(MACHINE_STATES.IDLE);
  const [result, setResult] = useState(null);
  const [winTier, setWinTier] = useState(WIN_TIERS.LOSS);
  const [statusMessage, setStatusMessage] = useState('Set your bet, then spin');
  const [controlsLocked, setControlsLocked] = useState(false);
  const [reelSymbols, setReelSymbols] = useState(['none', 'none', 'none']);
  const [spinToken, setSpinToken] = useState(0);
  const [effectsToken, setEffectsToken] = useState(0);
  const [nearMissHint, setNearMissHint] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turboMode, setTurboMode] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dailyGrantReady, setDailyGrantReady] = useState(true);
  const [dailyGrantAmount] = useState(gameStateRef.current.dailyGrantAmount);
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
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  useEffect(() => {
    const gameState = gameStateRef.current;
    if (typeof window !== 'undefined') {
      const storedDate = window.localStorage.getItem(DAILY_GRANT_STORAGE_KEY);
      gameState.hydrateDailyGrantDate(storedDate);
      setDailyGrantReady(gameState.canClaimDailyGrant());
    }
  }, []);

  useEffect(() => {
    setBetAmount((currentBet) => pickValidBet(balance, currentBet));
  }, [balance]);

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

    if (balance < 1 || betAmount > balance) {
      setStatusMessage('Balance too low for that bet');
      setAutoSpin(false);
      return;
    }

    clearAllTimers();
    setControlsLocked(true);
    setMachineState(MACHINE_STATES.SPINNING);
    setStatusMessage(turboMode ? 'Turbo spin in progress...' : 'Spinning reels...');
    setDisplayedWin(0);
    setResult(null);
    setResultMessage('');
    setWinTier(WIN_TIERS.LOSS);
    setIsNewBiggestWin(false);

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
    } catch (error) {
      setControlsLocked(false);
      setMachineState(MACHINE_STATES.IDLE);
      setStatusMessage(error.message);
      return;
    }

    const finalSymbols = spinResult.reels.map((reelValue) => gameState.getSymbolName(reelValue));
    const tier = getWinTier(spinResult.result);
    const payoutDuration = getPayoutDuration({
      tier,
      turboMode,
      reducedMotion,
    });
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
      const feedbackLabel = getFeedbackLabel(tier).toUpperCase();
      const popupMessage = isWin
        ? `${feedbackLabel}! +${formatCredits(spinResult.result.payout)} VC`
        : 'Better luck next spin';
      const currentBiggest = gameState.getBiggestWin();
      const becameBiggest =
        isWin && currentBiggest && spinResult.result.payout > previousBiggestPayout;

      setMachineState(MACHINE_STATES.RESULT);
      setBalance(spinResult.balance);
      setResult(spinResult.result);
      setResultMessage(popupMessage);
      setWinTier(tier);
      // Keep popup amount accurate by setting the exact spin payout immediately.
      setDisplayedWin(isWin ? spinResult.result.payout : 0);
      setLifetimeWinnings(gameState.getLifetimeWinnings());
      setWinLog(gameState.getWinLog());
      setBiggestWin(currentBiggest);
      setIsNewBiggestWin(Boolean(becameBiggest));
      setStatusMessage('Ready for your next spin');

      if (isWin) {
        setEffectsToken((token) => token + 1);
      }
    }, resultRevealDelay);

    const payoutTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.PAYOUT);
      if (spinResult.result.isWin) {
        if (soundEnabled) {
          playWinSound(tier);
        }
        startWinCounter(spinResult.result.payout, payoutDuration);
      }
    }, resultRevealDelay + RESULT_POPUP_DURATION_MS);

    const idleTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.IDLE);
      setControlsLocked(false);
      setNearMissHint(null);
      setStatusMessage('Set your bet and spin');
      setIsNewBiggestWin(false);
      if (spinResult.result.isWin) {
        setDisplayedWin(spinResult.result.payout);
      } else {
        setDisplayedWin(0);
      }
    }, resultRevealDelay + RESULT_POPUP_DURATION_MS + payoutDuration);

    timeoutIdsRef.current.push(resultTimer, payoutTimer, idleTimer);
  }, [
    machineState,
    controlsLocked,
    balance,
    betAmount,
    clearAllTimers,
    turboMode,
    soundEnabled,
    reducedMotion,
    spinProfile,
    startWinCounter,
  ]);

  const claimDailyGrant = useCallback(() => {
    const gameState = gameStateRef.current;
    try {
      const grantResult = gameState.claimDailyGrant();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DAILY_GRANT_STORAGE_KEY, grantResult.lastClaimDate);
      }
      setBalance(grantResult.balance);
      setDailyGrantReady(false);
      setStatusMessage(`Daily grant claimed: +${formatCredits(grantResult.amount)} VC`);
    } catch (error) {
      setDailyGrantReady(false);
      setStatusMessage(error.message);
    }
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimers();
    gameStateRef.current.resetGame();

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DAILY_GRANT_STORAGE_KEY);
    }

    setBalance(gameStateRef.current.getBalance());
    setBetAmount(pickValidBet(gameStateRef.current.getBalance(), gameStateRef.current.betAmount));
    setLifetimeWinnings(0);
    setWinLog([]);
    setBiggestWin(null);
    setIsNewBiggestWin(false);
    setResultMessage('');
    setDisplayedWin(0);
    setMachineState(MACHINE_STATES.IDLE);
    setResult(null);
    setWinTier(WIN_TIERS.LOSS);
    setStatusMessage('Game reset. Place your bet.');
    setControlsLocked(false);
    setReelSymbols(['none', 'none', 'none']);
    setNearMissHint(null);
    setAutoSpin(false);
    setDailyGrantReady(true);
  }, [clearAllTimers]);

  const stopAutoSpin = useCallback(() => {
    setAutoSpin(false);
    setStatusMessage('Auto-spin stopped');
  }, []);

  useEffect(() => {
    if (!autoSpin || controlsLocked || machineState !== MACHINE_STATES.IDLE) {
      return;
    }

    if (balance < 1 || betAmount > balance) {
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
  }, [autoSpin, controlsLocked, machineState, balance, betAmount, spin, turboMode]);

  const onReelStop = useCallback(() => {
    if (soundEnabled) {
      playStopSound();
    }
  }, [soundEnabled]);

  return {
    balance,
    betAmount,
    betOptions: BET_OPTIONS,
    netGain: lifetimeWinnings,
    winLog,
    biggestWin,
    isNewBiggestWin,
    effectsToken,
    dailyGrantAmount,
    dailyGrantReady,
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
