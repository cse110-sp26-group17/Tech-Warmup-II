import { useEffect, useMemo, useState } from 'react';
import { formatCredits } from '../../utils/formatCredits';
import './feed.css';

const PLAYER_PREFIXES = Object.freeze(['Player', 'Lucky', 'Spin', 'Neon', 'Ace', 'Robo']);
const SYMBOLS = Object.freeze([
  { label: 'CHERRY', emoji: 'C7' },
  { label: 'BAR', emoji: 'B2' },
  { label: 'BELL', emoji: 'BL' },
  { label: 'SEVEN', emoji: '77' },
]);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTickerEvent() {
  const prefix = PLAYER_PREFIXES[randomInt(0, PLAYER_PREFIXES.length - 1)];
  const userId = randomInt(100, 9999);
  const amount = randomInt(240, 6200);
  const symbol = SYMBOLS[randomInt(0, SYMBOLS.length - 1)];
  const tier = amount >= 4000 ? 'big' : amount >= 1800 ? 'mid' : 'small';

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: `${prefix}${userId} hit ${symbol.label} for ${formatCredits(amount)} VC`,
    symbolCode: symbol.emoji,
    amount,
    tier,
  };
}

function getNextDelayMs() {
  return randomInt(4000, 7000);
}

export default function WinsTicker() {
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const [events, setEvents] = useState(() => Array.from({ length: 4 }, () => createTickerEvent()));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleViewportChange = (event) => {
      setIsCompactViewport(event.matches);
      if (event.matches) {
        setIsCollapsed(true);
      }
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener('change', handleViewportChange);

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const queueEvent = () => {
      timeoutId = setTimeout(() => {
        if (!active) {
          return;
        }

        setEvents((currentEvents) => [...currentEvents, createTickerEvent()].slice(-6));
        queueEvent();
      }, getNextDelayMs());
    };

    queueEvent();

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const liveStatus = useMemo(
    () => (events[events.length - 1] ? `Live feed update: ${events[events.length - 1].text}` : 'Live feed ready'),
    [events]
  );

  return (
    <section className="wins-ticker live-feed" aria-label="Live wins feed">
      <header className="live-feed-header">
        <div className="live-feed-heading">
          <span className="live-dot" aria-hidden="true" />
          <p className="live-feed-title">LIVE FEED</p>
        </div>
        {isCompactViewport ? (
          <button
            type="button"
            className="feed-toggle"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-expanded={!isCollapsed}
            aria-controls="live-feed-items"
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        ) : null}
      </header>
      <div
        id="live-feed-items"
        className={`live-feed-list ${isCollapsed ? 'is-collapsed' : ''}`}
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {events.map((event, index) => (
          <article
            key={event.id}
            className={`feed-item tier-${event.tier}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="feed-symbol">{event.symbolCode}</span>
            <p className="feed-text">{event.text}</p>
          </article>
        ))}
      </div>
      <p className="sr-only">{liveStatus}</p>
    </section>
  );
}
