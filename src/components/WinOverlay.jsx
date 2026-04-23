import { MACHINE_STATES } from '../animations/reelAnimation';
import { formatCredits } from '../utils/formatCredits';

export default function WinOverlay({
  machineState,
  winTier,
  result,
  displayedWin,
  reducedMotion,
  resultMessage,
  isNewBiggestWin,
  milestonePopup,
  winStreak,
  comboMultiplier,
}) {
  const showOverlay =
    result && (machineState === MACHINE_STATES.RESULT || machineState === MACHINE_STATES.PAYOUT);

  if (!showOverlay) {
    return null;
  }

  const showWin = result.isWin === true;
  const layerClass = showWin ? `tier-${winTier} result-win` : 'tier-loss result-loss';
  const particlesByTier = {
    small: 5,
    medium: 15,
    big: 25,
    jackpot: 42,
  };
  const particleCount = particlesByTier[winTier] ?? 10;

  return (
    <section
      className={`win-overlay ${layerClass} ${reducedMotion ? 'reduced' : ''}`}
      aria-live="assertive"
      role="status"
    >
      <article className="win-card">
        <p className="win-heading">{resultMessage}</p>
        {showWin ? (
          <>
            <p className="win-value">+{formatCredits(displayedWin)} VC</p>
            <p className="win-detail">Multiplier x{result.multiplier}</p>
          </>
        ) : (
          <p className="win-detail">Keep the streak alive</p>
        )}

        {comboMultiplier > 1 ? <p className="combo-badge">COMBO x{comboMultiplier}</p> : null}
        {winStreak >= 3 ? <p className="streak-badge">HOT STREAK x{winStreak}!</p> : null}

        {showWin && isNewBiggestWin ? (
          <p className="biggest-win-badge">NEW BIGGEST WIN x{result.multiplier}</p>
        ) : null}
      </article>

      {milestonePopup ? <div className="milestone-popup">{milestonePopup}</div> : null}

      {showWin ? (
        <div className="particle-layer" aria-hidden="true">
          {Array.from({ length: particleCount }, (_, index) => (
            <span
              key={`particle-${index}`}
              style={{
                left: `${4 + ((index * 13) % 92)}%`,
                animationDelay: `${(index * 0.07) % 0.8}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {showWin && (isNewBiggestWin || winTier === 'jackpot') ? (
        <div className="firework-layer" aria-hidden="true" />
      ) : null}
    </section>
  );
}
