function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function SymbolInfoModal({ open, betAmount, symbolPayouts, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <section className="info-modal-backdrop" role="dialog" aria-modal="true" aria-label="Payout table">
      <article className="info-modal-card">
        <header className="info-modal-header">
          <h2>Payout Table</h2>
          <button type="button" className="info-close" onClick={onClose} aria-label="Close payout table">
            Close
          </button>
        </header>

        <p className="info-note">Match 3 identical symbols. Current bet: {formatCredits(betAmount)} VC.</p>

        <ul className="info-list">
          {symbolPayouts.map((symbol) => (
            <li key={symbol.name} className="info-item">
              <span className="info-symbol">{`${symbol.emoji}${symbol.emoji}${symbol.emoji} ${symbol.label}`}</span>
              <span className="info-multiplier">x{symbol.multiplier}</span>
              <span className="info-payout">+{formatCredits(symbol.multiplier * betAmount)} VC</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
