export default function SymbolInfoModal({ open, symbolPayouts, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <section className="info-modal-backdrop" role="dialog" aria-modal="true" aria-label="Symbol payouts">
      <article className="info-modal-card">
        <header className="info-modal-header">
          <h2>Symbols & Payouts</h2>
          <button type="button" className="info-close" onClick={onClose} aria-label="Close symbol payouts">
            Close
          </button>
        </header>

        <p className="info-note">Match 3 symbols to win. Payout = Bet x Multiplier.</p>

        <ul className="info-list">
          {symbolPayouts.map((symbol) => (
            <li key={symbol.name} className="info-item">
              <span className="info-symbol">
                {symbol.emoji} {symbol.label}
              </span>
              <span className="info-multiplier">x{symbol.multiplier}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
