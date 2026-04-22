import { MACHINE_STATES } from '../animations/reelAnimation';

function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getStateLabel(machineState) {
  if (machineState === MACHINE_STATES.SPINNING) {
    return 'Spinning';
  }
  if (machineState === MACHINE_STATES.RESULT) {
    return 'Result';
  }
  if (machineState === MACHINE_STATES.PAYOUT) {
    return 'Payout';
  }
  return 'Idle';
}

export default function HUD({ balance, betAmount, netGain, machineState }) {
  const netGainPrefix = netGain >= 0 ? '+' : '-';
  const netGainClass = netGain >= 0 ? 'positive' : 'negative';

  return (
    <section className="hud" aria-label="Game stats">
      <article className="hud-card">
        <p className="hud-label">Balance</p>
        <p className="hud-value">{formatCredits(balance)}</p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Bet</p>
        <p className="hud-value">{formatCredits(betAmount)}</p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Net Gain</p>
        <p className={`hud-value net-gain ${netGainClass}`}>
          {netGainPrefix}
          {formatCredits(Math.abs(netGain))}
        </p>
      </article>

      <p className="hud-state" role="status" aria-live="polite">
        State: {getStateLabel(machineState)}
      </p>
    </section>
  );
}
