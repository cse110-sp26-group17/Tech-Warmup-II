import './indicators.css';

function getLuckTone(progressPercent) {
  if (progressPercent >= 90) {
    return 'max';
  }
  if (progressPercent >= 60) {
    return 'high';
  }
  if (progressPercent >= 35) {
    return 'mid';
  }
  return 'low';
}

export default function LuckMeter({ lossStreak, pityThreshold = 8, freeRollThreshold = 10 }) {
  const cappedLosses = Math.min(lossStreak, freeRollThreshold);
  const progressPercent = Math.round((cappedLosses / freeRollThreshold) * 100);
  const tone = getLuckTone(progressPercent);
  const untilPity = Math.max(0, pityThreshold - lossStreak);
  const untilFreeRoll = Math.max(0, freeRollThreshold - lossStreak);

  return (
    <section className={`luck-meter tone-${tone}`} aria-label="Luck momentum meter">
      <div className="luck-meter-head">
        <p className="luck-meter-label">Luck Meter</p>
        <p className="luck-meter-value">{progressPercent}%</p>
      </div>
      <div className="luck-meter-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
        <span className="luck-meter-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="luck-meter-detail">
        {untilFreeRoll === 0
          ? 'Free roll trigger reached'
          : `Pity in ${untilPity} | Free roll in ${untilFreeRoll}`}
      </p>
    </section>
  );
}
