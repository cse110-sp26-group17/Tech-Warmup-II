import { MACHINE_STATES, SYMBOL_DISPLAY, WIN_TIERS, getFeedbackLabel } from '../animations/reelAnimation';

function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function WinOverlay({
  machineState,
  winTier,
  result,
  displayedWin,
  reducedMotion,
}) {
  if (!result || machineState === MACHINE_STATES.IDLE || machineState === MACHINE_STATES.SPINNING) {
    return null;
  }

  const showWin = result.isWin === true;
  const heading = showWin ? getFeedbackLabel(winTier) : 'No Win';
  const symbolLabel = SYMBOL_DISPLAY[result.symbolName].label;
  const layerClass = showWin ? `tier-${winTier}` : 'tier-loss';

  return (
    <section
      className={`win-overlay ${layerClass} ${reducedMotion ? 'reduced' : ''}`}
      aria-live="assertive"
      role="status"
    >
      <article className="win-card">
        <p className="win-heading">{heading}</p>
        <p className="win-symbol">Symbol: {symbolLabel}</p>
        {showWin ? (
          <>
            <p className="win-value">+{formatCredits(displayedWin)}</p>
            <p className="win-detail">Multiplier x{result.multiplier}</p>
          </>
        ) : (
          <p className="win-detail">Try another spin</p>
        )}
      </article>

      {showWin && (winTier === WIN_TIERS.MEDIUM || winTier === WIN_TIERS.BIG || winTier === WIN_TIERS.JACKPOT) ? (
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
    </section>
  );
}
