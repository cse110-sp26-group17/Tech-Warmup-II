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
        Bet: {formatValue(betAmount)} VC
      </div>
      <div className="bet-options" role="group" aria-label="Select bet amount">
        {betOptions.map((option) => {
          const isSelected = option === betAmount;
          const isMaxBet = option === 100;
          return (
            <button
              key={option}
              type="button"
              className={`bet-button option ${isSelected ? 'selected' : ''} ${isMaxBet ? 'max-bet' : ''}`}
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
