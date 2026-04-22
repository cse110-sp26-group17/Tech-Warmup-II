function formatValue(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function BetControls({
  betAmount,
  disabled,
  onDecrement,
  onIncrement,
  onMaxBet,
}) {
  return (
    <section className="bet-controls" aria-label="Bet controls">
      <button type="button" className="bet-button" onClick={onDecrement} disabled={disabled}>
        -
      </button>
      <div className="bet-display" aria-live="polite">
        Bet: {formatValue(betAmount)}
      </div>
      <button type="button" className="bet-button" onClick={onIncrement} disabled={disabled}>
        +
      </button>
      <button type="button" className="bet-button max" onClick={onMaxBet} disabled={disabled}>
        Max
      </button>
    </section>
  );
}
