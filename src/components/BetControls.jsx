function formatValue(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function BetControls({
  betOptions,
  betAmount,
  balance,
  disabled,
  onSelectBet,
}) {
  return (
    <section className="bet-controls" aria-label="Bet controls">
      <div className="bet-display" aria-live="polite">
        Bet: {formatValue(betAmount)}
      </div>
      <div className="bet-options" role="group" aria-label="Select bet amount">
        {betOptions.map((option) => {
          const isSelected = option === betAmount;
          return (
            <button
              key={option}
              type="button"
              className={`bet-button option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectBet(option)}
              disabled={disabled || option > balance}
              aria-pressed={isSelected}
            >
              {formatValue(option)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
