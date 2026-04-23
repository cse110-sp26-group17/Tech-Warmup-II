import { formatCredits } from '../utils/formatCredits';

export default function HUD({ balance, betAmount, netGain, meta }) {
  const safeWinnings = Math.max(0, netGain);
  const streakLabel = meta.currentWinStreak > 0 ? `W ${meta.currentWinStreak}` : `L ${meta.currentLossStreak}`;
  const isHotStreak = meta.currentWinStreak >= 3;
  const comboActive = meta.comboMultiplier > 1;

  return (
    <section className="hud" aria-label="Game stats">
      <article className="hud-card">
        <p className="hud-label">Balance</p>
        <p className="hud-value">{formatCredits(balance)} VC</p>
      </article>

      <article className={`hud-card ${comboActive ? 'combo-active' : ''}`}>
        <p className="hud-label">Bet / Combo</p>
        <p className="hud-value">
          {formatCredits(betAmount)} VC {comboActive ? `| x${meta.comboMultiplier}` : ''}
        </p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Lifetime Winnings</p>
        <p className="hud-value net-gain positive">+{formatCredits(safeWinnings)} VC</p>
      </article>

      <div className="quick-stats" role="status" aria-live="polite">
        <p className="quick-stat">Spins: {formatCredits(meta.totalSpins)}</p>
        <p className={`quick-stat ${isHotStreak ? 'hot-streak' : ''}`}>Streak: {streakLabel}</p>
        <p className="quick-stat">Next Bonus: {meta.nextMilestoneIn}</p>
        <p className="quick-stat jackpot">Jackpot: {formatCredits(meta.progressiveJackpotPool, { maximumFractionDigits: 2 })} VC</p>
        <p className={`temp-pill tone-${meta.machineTemperature.tone}`}>{meta.machineTemperature.label}</p>
      </div>
    </section>
  );
}
