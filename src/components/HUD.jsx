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
  const safeWinnings = Math.max(0, netGain);

  return (
    <section className="hud" aria-label="Game stats">
      <article className="hud-card">
        <p className="hud-label">Balance</p>
        <p className="hud-value">{formatCredits(balance)} VC</p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Bet</p>
        <p className="hud-value">{formatCredits(betAmount)} VC</p>
      </article>

      <article className="hud-card">
        <p className="hud-label">Lifetime Winnings</p>
        <p className="hud-value net-gain positive">+{formatCredits(safeWinnings)} VC</p>
      </article>

      <p className="hud-state" role="status" aria-live="polite">
        State: {getStateLabel(machineState)}
      </p>
    </section>
  );
}
