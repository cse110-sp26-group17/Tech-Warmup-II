import { useEffect, useRef, useState } from 'react';

function getStreakMultiplier(winStreak) {
  if (winStreak <= 0) {
    return 1;
  }
  return Math.min(3, 1 + (winStreak - 1) * 0.5);
}

function getStreakTone(winStreak) {
  if (winStreak >= 5) {
    return 'max';
  }
  if (winStreak >= 4) {
    return 'high';
  }
  if (winStreak >= 2) {
    return 'mid';
  }
  if (winStreak >= 1) {
    return 'low';
  }
  return 'idle';
}

export default function StreakCounter({ winStreak, comboMultiplier }) {
  const previousWinStreakRef = useRef(winStreak);
  const [resetPulse, setResetPulse] = useState(false);

  useEffect(() => {
    const hadStreak = previousWinStreakRef.current > 0;
    const streakReset = hadStreak && winStreak === 0;

    if (streakReset) {
      setResetPulse(true);
      const timerId = setTimeout(() => setResetPulse(false), 480);
      previousWinStreakRef.current = winStreak;
      return () => clearTimeout(timerId);
    }

    previousWinStreakRef.current = winStreak;
    return undefined;
  }, [winStreak]);

  const streakMultiplier = getStreakMultiplier(winStreak);
  const tone = getStreakTone(winStreak);

  return (
    <section
      className={`streak-counter tone-${tone} ${resetPulse ? 'reset-pulse' : ''}`}
      aria-live="polite"
      aria-label="Win streak multiplier"
    >
      <p className="streak-counter-label">Win Streak Multiplier</p>
      <p className="streak-counter-value">x{streakMultiplier.toFixed(1).replace('.0', '')}</p>
      <p className="streak-counter-detail">
        {winStreak > 0 ? `Streak ${winStreak} | Combo x${comboMultiplier}` : 'Land a win to start your streak'}
      </p>
    </section>
  );
}
