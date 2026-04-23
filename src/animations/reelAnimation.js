export const MACHINE_STATES = Object.freeze({
  IDLE: 'idle',
  SPINNING: 'spinning',
  RESULT: 'result',
  PAYOUT: 'payout',
});

export const WIN_TIERS = Object.freeze({
  LOSS: 'loss',
  SMALL: 'small',
  MEDIUM: 'medium',
  BIG: 'big',
  JACKPOT: 'jackpot',
});

export const SYMBOL_DISPLAY = Object.freeze({
  cherry: { code: '🍒', label: 'Cherry' },
  bar: { code: '🍋', label: 'Lemon' },
  bell: { code: '🔔', label: 'Bell' },
  seven: { code: '7️⃣', label: 'Seven' },
  none: { code: '⭐', label: 'Star' },
  bonus: { code: '🎁', label: 'Bonus' },
});

const SYMBOL_ORDER = ['cherry', 'bar', 'bell', 'seven', 'none'];

/**
 * Converts a raw reel integer to its symbol name.
 * @param {number} reelValue - Raw reel value (0–9).
 * @returns {'cherry' | 'bar' | 'bell' | 'seven' | 'none'}
 */
export function reelToSymbolName(reelValue) {
  if (reelValue >= 0 && reelValue <= 1) {
    return 'cherry';
  }
  if (reelValue >= 2 && reelValue <= 3) {
    return 'bar';
  }
  if (reelValue >= 4 && reelValue <= 5) {
    return 'bell';
  }
  if (reelValue >= 6 && reelValue <= 7) {
    return 'seven';
  }
  return 'none';
}

/**
 * Returns a uniformly random symbol name from the symbol order list.
 * @returns {string}
 */
export function getRandomSymbol() {
  const randomIndex = Math.floor(Math.random() * SYMBOL_ORDER.length);
  return SYMBOL_ORDER[randomIndex];
}

/**
 * Returns reel durations and total spin duration for the current motion settings.
 * @param {{turboMode: boolean, reducedMotion: boolean}} options
 * @returns {{reelDurations: number[], totalSpinDuration: number, resultHoldDuration: number}}
 */
export function getSpinProfile({ turboMode, reducedMotion }) {
  if (reducedMotion) {
    return {
      reelDurations: [500, 590, 680, 770, 860],
      totalSpinDuration: 900,
      resultHoldDuration: 120,
    };
  }

  if (turboMode) {
    return {
      reelDurations: [520, 640, 780, 900, 1020],
      totalSpinDuration: 1060,
      resultHoldDuration: 110,
    };
  }

  return {
    reelDurations: [900, 1100, 1300, 1500, 1720],
    totalSpinDuration: 1780,
    resultHoldDuration: 240,
  };
}

/**
 * Classifies a spin result into a win tier constant.
 * @param {{isWin: boolean, multiplier: number, jackpotBonus?: number} | null | undefined} result
 * @returns {string} One of the WIN_TIERS values.
 */
export function getWinTier(result) {
  if (!result || result.isWin !== true || result.multiplier <= 0) {
    return WIN_TIERS.LOSS;
  }
  if (result.jackpotBonus > 0 || result.multiplier >= 9) {
    return WIN_TIERS.JACKPOT;
  }
  if (result.multiplier >= 4) {
    return WIN_TIERS.BIG;
  }
  if (result.multiplier >= 2) {
    return WIN_TIERS.MEDIUM;
  }
  return WIN_TIERS.SMALL;
}

/**
 * Returns the payout animation duration in milliseconds for the given win tier and motion settings.
 * @param {{tier: string, turboMode: boolean, reducedMotion: boolean}} options
 * @returns {number} Duration in milliseconds.
 */
export function getPayoutDuration({ tier, turboMode, reducedMotion }) {
  if (reducedMotion) {
    return tier === WIN_TIERS.LOSS ? 120 : 200;
  }
  if (turboMode) {
    if (tier === WIN_TIERS.JACKPOT) {
      return 360;
    }
    if (tier === WIN_TIERS.BIG || tier === WIN_TIERS.MEDIUM) {
      return 260;
    }
    if (tier === WIN_TIERS.SMALL) {
      return 170;
    }
    return 130;
  }
  if (tier === WIN_TIERS.JACKPOT) {
    return 1200;
  }
  if (tier === WIN_TIERS.BIG) {
    return 850;
  }
  if (tier === WIN_TIERS.MEDIUM) {
    return 640;
  }
  if (tier === WIN_TIERS.SMALL) {
    return 420;
  }
  return 220;
}

/**
 * Returns the UI feedback label string for a given win tier.
 * @param {string} tier - One of the WIN_TIERS values.
 * @returns {string}
 */
export function getFeedbackLabel(tier) {
  if (tier === WIN_TIERS.JACKPOT) {
    return 'JACKPOT';
  }
  if (tier === WIN_TIERS.BIG) {
    return 'BIG WIN';
  }
  if (tier === WIN_TIERS.MEDIUM) {
    return 'MEGA WIN';
  }
  if (tier === WIN_TIERS.SMALL) {
    return 'WIN';
  }
  return 'NO WIN';
}

/**
 * Returns a temperature badge label and tone based on recent win frequency.
 * @param {boolean[]} recentResults - Array of win/loss booleans (up to last 10 spins).
 * @returns {{label: string, tone: 'fire' | 'hot' | 'warm' | 'cold'}}
 */
export function getMachineTemperatureBadge(recentResults) {
  const winsInLastTen = recentResults.filter(Boolean).length;
  if (winsInLastTen >= 4) {
    return { label: 'MACHINE ON FIRE', tone: 'fire' };
  }
  if (winsInLastTen >= 3) {
    return { label: 'Machine Hot', tone: 'hot' };
  }
  if (winsInLastTen >= 2) {
    return { label: 'Machine Warm', tone: 'warm' };
  }
  return { label: 'Machine Cold', tone: 'cold' };
}

/**
 * Returns the next symbol in SYMBOL_ORDER after the given one, skipping 'none'.
 * @param {string} symbolName - Current symbol key.
 * @returns {string} Adjacent symbol name.
 */
function getAdjacentSymbol(symbolName) {
  const currentIndex = SYMBOL_ORDER.indexOf(symbolName);
  if (currentIndex < 0) {
    return 'bar';
  }
  const nextIndex = (currentIndex + 1) % SYMBOL_ORDER.length;
  const nextSymbol = SYMBOL_ORDER[nextIndex];
  if (nextSymbol === 'none') {
    return 'bell';
  }
  return nextSymbol;
}

/**
 * Creates a near-miss animation hint when the first two reels match but the third does not.
 * Returns null if the spin was a win, the pattern doesn't qualify, or a random threshold is not met.
 * @param {{isWin: boolean, finalSymbols: string[]}} options
 * @returns {{reelIndex: number, previewSymbol: string, finalMissSymbol: string, previewDurationMs: number, slowDownFactor: number, bannerText: string, message: string} | null}
 */
export function createNearMissHint({ isWin, finalSymbols }) {
  if (isWin === true) {
    return null;
  }

  const firstTwoMatch =
    finalSymbols[0] === finalSymbols[1] && finalSymbols[0] !== 'none' && finalSymbols[1] !== 'none';
  const thirdMisses = finalSymbols[2] !== finalSymbols[0];

  if (!firstTwoMatch || !thirdMisses || Math.random() > 0.35) {
    return null;
  }

  const targetBase = finalSymbols[0];
  const safeMissSymbol = getAdjacentSymbol(targetBase);

  return {
    reelIndex: 2,
    previewSymbol: targetBase,
    finalMissSymbol: safeMissSymbol,
    previewDurationMs: 320,
    slowDownFactor: 1.35,
    bannerText: 'SO CLOSE!',
    message: `So close! ${SYMBOL_DISPLAY[targetBase].label} almost hit`,
  };
}
