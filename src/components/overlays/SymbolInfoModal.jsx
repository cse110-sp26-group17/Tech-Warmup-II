import { formatCredits } from '../../utils/formatCredits';

export default function SymbolInfoModal({ open, betAmount, symbolPayouts, onClose }) {
  if (!open) {
    return null;
  }

  const tiers = [
    { label: '3 in a row', multiplier: 1 },
    { label: '4 in a row', multiplier: 1.8 },
    { label: '5 in a row', multiplier: 3 },
  ];

  return (
    <section className="info-modal-backdrop" role="dialog" aria-modal="true" aria-label="Payout table">
      <article className="info-modal-card">
        <header className="info-modal-header">
          <h2>Payout Table</h2>
          <button type="button" className="info-close" onClick={onClose} aria-label="Close payout table">
            Close
          </button>
        </header>

        <p className="info-note">
          Match 3+ identical symbols from the left. Current bet: {formatCredits(betAmount)} VC.
        </p>

        <ul className="info-list">
          {symbolPayouts.map((symbol) => (
            <li key={symbol.name} className="info-item">
              <span className="info-symbol">{`${symbol.emoji} ${symbol.label}`}</span>
              <span className="info-multiplier">x{symbol.multiplier}</span>
              <span className="info-payout">
                {tiers.map((tier) => (
                  <span key={tier.label} className="info-payout-tier">
                    {tier.label}: +{formatCredits(symbol.multiplier * tier.multiplier * betAmount)} VC
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
