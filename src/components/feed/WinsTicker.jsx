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
  const [events, setEvents] = useState(() => Array.from({ length: 4 }, () => createTickerEvent()));

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
        <span className="live-dot" aria-hidden="true" />
        <p className="live-feed-title">LIVE FEED</p>
      </header>
      <div className="live-feed-list" role="log" aria-live="polite" aria-atomic="false">
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
