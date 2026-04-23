import './indicators.css';

export default function RecentSpins({ recentResults }) {
  const displayItems = Array.isArray(recentResults) ? recentResults.slice(-5) : [];

  return (
    <section className="recent-spins" aria-label="Recent spin outcomes">
      <p className="recent-spins-label">Recent Spins</p>
      <div className="recent-spins-track">
        {displayItems.length === 0 ? (
          <span className="recent-spins-empty">No spins yet</span>
        ) : (
          displayItems.map((wasWin, index) => (
            <span
              key={`recent-spin-${index}`}
              className={`recent-spin-dot ${wasWin ? 'win' : 'loss'}`}
              title={wasWin ? 'Win' : 'Loss'}
              aria-label={wasWin ? 'Recent win' : 'Recent loss'}
            />
          ))
        )}
      </div>
    </section>
  );
}
