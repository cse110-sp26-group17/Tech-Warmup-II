import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameState from '../GameState';
import {
  MACHINE_STATES,
  WIN_TIERS,
  createNearMissHint,
  getFeedbackLabel,
  getPayoutDuration,
  getSpinProfile,
  getWinTier,
  reelToSymbolName,
} from '../animations/reelAnimation';
import { playSpinSound, playStopSound, playWinSound } from '../audio/soundHooks';

const BET_STEP = 10;

function clampBet(value, balance) {
  const rounded = Math.floor(value);
  const maxBet = Math.max(1, Math.floor(balance));
  return Math.max(1, Math.min(rounded, maxBet));
}

export function useSlotMachineController() {
  const gameStateRef = useRef(new GameState());
  const timeoutIdsRef = useRef([]);
  const winCounterIntervalRef = useRef(null);

  const [balance, setBalance] = useState(gameStateRef.current.getBalance());
  const [betAmount, setBetAmount] = useState(gameStateRef.current.betAmount);
  const [lastWin, setLastWin] = useState(0);
  const [displayedWin, setDisplayedWin] = useState(0);
  const [machineState, setMachineState] = useState(MACHINE_STATES.IDLE);
  const [result, setResult] = useState(null);
  const [winTier, setWinTier] = useState(WIN_TIERS.LOSS);
  const [statusMessage, setStatusMessage] = useState('Set your bet, then spin');
  const [controlsLocked, setControlsLocked] = useState(false);
  const [reelSymbols, setReelSymbols] = useState(['none', 'none', 'none']);
  const [spinToken, setSpinToken] = useState(0);
  const [nearMissHint, setNearMissHint] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turboMode, setTurboMode] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    setBetAmount((currentBet) => clampBet(currentBet, balance));
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

      const tickEveryMs = 40;
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

  const decrementBet = useCallback(() => {
    if (controlsLocked) {
      return;
    }
    setBetAmount((currentBet) => clampBet(currentBet - BET_STEP, balance));
  }, [controlsLocked, balance]);

  const incrementBet = useCallback(() => {
    if (controlsLocked) {
      return;
    }
    setBetAmount((currentBet) => clampBet(currentBet + BET_STEP, balance));
  }, [controlsLocked, balance]);

  const maxBet = useCallback(() => {
    if (controlsLocked) {
      return;
    }
    const nextMax = Math.max(1, Math.floor(balance));
    setBetAmount(nextMax);
  }, [controlsLocked, balance]);

  const spin = useCallback(() => {
    if (machineState !== MACHINE_STATES.IDLE || controlsLocked) {
      return;
    }

    if (balance < 1 || betAmount > balance) {
      setStatusMessage('Insufficient balance for current bet');
      setAutoSpin(false);
      return;
    }

    clearAllTimers();
    setControlsLocked(true);
    setMachineState(MACHINE_STATES.SPINNING);
    setStatusMessage(turboMode ? 'Turbo spinning...' : 'Spinning...');
    setDisplayedWin(0);
    setResult(null);
    setWinTier(WIN_TIERS.LOSS);

    const gameState = gameStateRef.current;
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

    const finalSymbols = spinResult.reels.map((reelValue) => reelToSymbolName(reelValue));
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

    setNearMissHint(nearMiss);
    setReelSymbols(finalSymbols);
    setSpinToken((token) => token + 1);

    if (soundEnabled) {
      playSpinSound();
    }

    const resultTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.RESULT);
      setBalance(spinResult.balance);
      setResult(spinResult.result);
      setWinTier(tier);
      setLastWin(spinResult.result.isWin ? spinResult.result.payout : 0);
      setStatusMessage(
        spinResult.result.isWin
          ? `${getFeedbackLabel(tier)} on ${finalSymbols[0].toUpperCase()}`
          : nearMiss
            ? nearMiss.message
            : 'No win this spin'
      );
    }, spinProfile.totalSpinDuration);

    const payoutTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.PAYOUT);
      if (spinResult.result.isWin) {
        if (soundEnabled) {
          playWinSound(tier);
        }
        startWinCounter(spinResult.result.payout, payoutDuration);
      }
    }, spinProfile.totalSpinDuration + spinProfile.resultHoldDuration);

    const idleTimer = setTimeout(() => {
      setMachineState(MACHINE_STATES.IDLE);
      setControlsLocked(false);
      setNearMissHint(null);
      setStatusMessage('Ready');
      if (spinResult.result.isWin) {
        setDisplayedWin(spinResult.result.payout);
      } else {
        setDisplayedWin(0);
      }
    }, spinProfile.totalSpinDuration + spinProfile.resultHoldDuration + payoutDuration);

    timeoutIdsRef.current.push(resultTimer, payoutTimer, idleTimer);
  }, [
    machineState,
    controlsLocked,
    balance,
    betAmount,
    clearAllTimers,
    turboMode,
    soundEnabled,
    spinProfile.totalSpinDuration,
    spinProfile.resultHoldDuration,
    reducedMotion,
    startWinCounter,
  ]);

  useEffect(() => {
    if (!autoSpin || controlsLocked || machineState !== MACHINE_STATES.IDLE) {
      return;
    }

    if (balance < 1 || betAmount > balance) {
      setAutoSpin(false);
      setStatusMessage('Auto-spin stopped: insufficient balance');
      return;
    }

    const autoSpinTimer = setTimeout(() => {
      spin();
    }, turboMode ? 110 : 240);

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
    lastWin,
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
    spin,
    decrementBet,
    incrementBet,
    maxBet,
    onReelStop,
    setTurboMode,
    setAutoSpin,
    setSettingsOpen,
    setSoundEnabled,
    setReducedMotion,
  };
}
