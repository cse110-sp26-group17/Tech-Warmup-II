import { useEffect, useMemo, useState } from 'react';
import { formatCredits } from '../utils/formatCredits';

const PLAYER_PREFIXES = Object.freeze(['Player', 'Lucky', 'Spin', 'Neon', 'Ace', 'Robo']);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTickerMessage() {
  const prefix = PLAYER_PREFIXES[randomInt(0, PLAYER_PREFIXES.length - 1)];
  const userId = randomInt(100, 9999);
  const amount = randomInt(240, 4200);
  return `${prefix}${userId} just won ${formatCredits(amount)} VC!`;
}

function getNextDelayMs() {
  return randomInt(8000, 12000);
}

export default function WinsTicker() {
  const [messages, setMessages] = useState(() => Array.from({ length: 4 }, () => createTickerMessage()));

  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const queueMessage = () => {
      timeoutId = setTimeout(() => {
        if (!active) {
          return;
        }
        setMessages((currentMessages) =>
          [...currentMessages, createTickerMessage()].slice(-10)
        );
        queueMessage();
      }, getNextDelayMs());
    };

    queueMessage();

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const tickerText = useMemo(() => messages.join('  •  '), [messages]);

  return (
    <section className="wins-ticker" aria-label="Live wins ticker">
      <div className="wins-ticker-viewport">
        <p className="wins-ticker-track">{tickerText}</p>
      </div>
    </section>
  );
}
