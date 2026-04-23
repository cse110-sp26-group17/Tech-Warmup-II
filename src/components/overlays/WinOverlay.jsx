import { MACHINE_STATES } from '../../animations/reelAnimation';
import { formatCredits } from '../../utils/formatCredits';
import './overlays.css';

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
  const particlesByTier = {
    small: 5,
    medium: 15,
    big: 25,
    jackpot: 42,
  };
  const particleCount = particlesByTier[winTier] ?? 10;

  if (!showWin) {
    return (
      <section className="loss-toast" aria-live="assertive" role="status">
        <article className="loss-toast-card">
          <p className="win-heading">{resultMessage}</p>
          <p className="win-detail">Keep the streak alive</p>
        </article>
      </section>
    );
  }

  return (
    <section
      className={`win-overlay tier-${winTier} result-win ${reducedMotion ? 'reduced' : ''}`}
      aria-live="assertive"
      role="status"
    >
      <article className="win-card">
        <p className="win-heading">{resultMessage}</p>
        <p className="win-value">+{formatCredits(displayedWin)} VC</p>
        <p className="win-detail">Multiplier x{result.multiplier}</p>

        {comboMultiplier > 1 ? <p className="combo-badge">COMBO x{comboMultiplier}</p> : null}
        {winStreak >= 3 ? <p className="streak-badge">HOT STREAK x{winStreak}!</p> : null}

        {isNewBiggestWin ? (
          <p className="biggest-win-badge">NEW BIGGEST WIN x{result.multiplier}</p>
        ) : null}
      </article>

      {milestonePopup ? <div className="milestone-popup">{milestonePopup}</div> : null}

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

      {(isNewBiggestWin || winTier === 'jackpot') ? (
        <div className="firework-layer" aria-hidden="true" />
      ) : null}
    </section>
  );
}
