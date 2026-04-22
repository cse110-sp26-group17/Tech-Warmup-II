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
}) {
  const isSpinning = machineState === MACHINE_STATES.SPINNING;

  return (
    <section className="spin-controls" aria-label="Spin controls">
      <button
        type="button"
        className={`spin-button ${isSpinning ? 'is-busy' : ''}`}
        disabled={disabled}
        onClick={onSpin}
        aria-label={isSpinning ? 'Reels are spinning' : 'Spin'}
      >
        {isSpinning ? 'SPINNING' : 'SPIN'}
      </button>

      <div className="toggle-row">
        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={turboMode}
            onChange={(event) => onToggleTurbo(event.target.checked)}
            disabled={disabled}
          />
          <span>Turbo</span>
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
        <button
          type="button"
          className="action-button stop-auto"
          onClick={onStopAutoSpin}
        >
          Stop Auto-Spin
        </button>
      ) : null}
    </section>
  );
}
