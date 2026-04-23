import { MACHINE_STATES } from '../animations/reelAnimation';

function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function WinOverlay({
  machineState,
  winTier,
  result,
  displayedWin,
  reducedMotion,
  resultMessage,
  isNewBiggestWin,
}) {
  if (!result || machineState !== MACHINE_STATES.RESULT) {
    return null;
  }

  const showWin = result.isWin === true;
  const layerClass = showWin ? `tier-${winTier} result-win` : 'tier-loss result-loss';

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

        {showWin && isNewBiggestWin ? (
          <p className="biggest-win-badge">NEW BIGGEST WIN x{result.multiplier}</p>
        ) : null}
      </article>

      {showWin ? (
        <div className="particle-layer" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {showWin && isNewBiggestWin ? <div className="firework-layer" aria-hidden="true" /> : null}
    </section>
  );
}
