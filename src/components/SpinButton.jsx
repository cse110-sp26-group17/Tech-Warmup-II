import { MACHINE_STATES } from '../animations/reelAnimation';

export default function SpinButton({
  machineState,
  disabled,
  onSpin,
  turboMode,
  onToggleTurbo,
  autoSpin,
  onToggleAutoSpin,
  onStopAutoSpin,
  lossStreak,
}) {
  const isSpinning = machineState === MACHINE_STATES.SPINNING;
  const urgencyClass = lossStreak >= 5 ? 'urgency-high' : lossStreak >= 3 ? 'urgency-mid' : '';

  return (
    <section className="spin-controls" aria-label="Spin controls">
      <button
        type="button"
        className={`spin-button ${isSpinning ? 'is-busy' : ''} ${urgencyClass}`}
        disabled={disabled}
        onClick={onSpin}
        aria-label={isSpinning ? 'Reels are spinning' : 'Spin'}
      >
        {isSpinning ? 'SPINNING' : 'SPIN NOW'}
      </button>

      <div className="toggle-row">
        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={turboMode}
            onChange={(event) => onToggleTurbo(event.target.checked)}
            disabled={disabled}
          />
          <span>Turbo (0.8s)</span>
        </label>

        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={autoSpin}
            onChange={(event) => onToggleAutoSpin(event.target.checked)}
            disabled={disabled}
          />
          <span>Auto-Spin</span>
        </label>
      </div>

      {autoSpin ? (
        <button type="button" className="action-button stop-auto" onClick={onStopAutoSpin}>
          STOP AUTO-SPIN
        </button>
      ) : null}
    </section>
  );
}
