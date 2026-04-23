import { formatCredits } from '../../utils/formatCredits';
import './hud.css';

export default function HUD({
  displayedBalance,
  isBalanceCounting,
  betAmount,
  lastWinAmount,
  comboMultiplier,
  freeRolls,
}) {
  const comboActive = comboMultiplier > 1;

  return (
    <section className="hud" aria-label="Game stats">
      <article className="hud-card">
        <p className="hud-label">Balance</p>
        <p className={`hud-value ${isBalanceCounting ? 'balance-counting' : ''}`}>
          {formatCredits(displayedBalance)} VC
        </p>
      </article>

      <article className={`hud-card ${comboActive ? 'combo-active' : ''}`}>
        <p className="hud-label">Bet / Combo</p>
        <p className="hud-value">
          {formatCredits(betAmount)} VC {comboActive ? `| x${comboMultiplier}` : ''}
        </p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Last Win</p>
        <p className={`hud-value net-gain ${lastWinAmount > 0 ? 'positive' : ''}`}>
          {lastWinAmount > 0 ? `+${formatCredits(lastWinAmount)} VC` : '--'}
        </p>
      </article>

      {freeRolls > 0 ? (
        <p className="free-roll-pill" aria-live="polite">
          FREE ROLLS: {freeRolls}
        </p>
      ) : null}
    </section>
  );
}
