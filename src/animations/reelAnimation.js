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
  cherry: { code: '🍒', label: 'Cherries' },
  bar: { code: '🍋', label: 'Lemon' },
  bell: { code: '🔔', label: 'Bell' },
  seven: { code: '7️⃣', label: 'Seven' },
  none: { code: '⭐', label: 'Star' },
});

const SYMBOL_ORDER = ['cherry', 'bar', 'bell', 'seven', 'none'];

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

export function getRandomSymbol() {
  const randomIndex = Math.floor(Math.random() * SYMBOL_ORDER.length);
  return SYMBOL_ORDER[randomIndex];
}

export function getSpinProfile({ turboMode, reducedMotion }) {
  if (reducedMotion) {
    return {
      reelDurations: [1000, 1160, 1320],
      totalSpinDuration: 1360,
      resultHoldDuration: 160,
    };
  }

  if (turboMode) {
    return {
      reelDurations: [1050, 1250, 1450],
      totalSpinDuration: 1520,
      resultHoldDuration: 130,
    };
  }

  return {
    reelDurations: [1160, 1420, 1680],
    totalSpinDuration: 1760,
    resultHoldDuration: 280,
  };
}

export function getWinTier(result) {
  if (!result || result.isWin !== true || result.multiplier <= 0) {
    return WIN_TIERS.LOSS;
  }
  if (result.multiplier >= 100) {
    return WIN_TIERS.JACKPOT;
  }
  if (result.multiplier >= 50) {
    return WIN_TIERS.BIG;
  }
  if (result.multiplier >= 25) {
    return WIN_TIERS.MEDIUM;
  }
  return WIN_TIERS.SMALL;
}

export function getPayoutDuration({ tier, turboMode, reducedMotion }) {
  if (reducedMotion) {
    return tier === WIN_TIERS.LOSS ? 120 : 250;
  }
  if (turboMode) {
    if (tier === WIN_TIERS.JACKPOT) {
      return 380;
    }
    if (tier === WIN_TIERS.BIG || tier === WIN_TIERS.MEDIUM) {
      return 260;
    }
    if (tier === WIN_TIERS.SMALL) {
      return 180;
    }
    return 130;
  }
  if (tier === WIN_TIERS.JACKPOT) {
    return 1200;
  }
  if (tier === WIN_TIERS.BIG) {
    return 900;
  }
  if (tier === WIN_TIERS.MEDIUM) {
    return 680;
  }
  if (tier === WIN_TIERS.SMALL) {
    return 450;
  }
  return 220;
}

export function getFeedbackLabel(tier) {
  if (tier === WIN_TIERS.JACKPOT) {
    return 'Jackpot';
  }
  if (tier === WIN_TIERS.BIG) {
    return 'Big Win';
  }
  if (tier === WIN_TIERS.MEDIUM) {
    return 'Medium Win';
  }
  if (tier === WIN_TIERS.SMALL) {
    return 'Small Win';
  }
  return 'No Win';
}

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

export function createNearMissHint({ isWin, finalSymbols }) {
  if (isWin === true || Math.random() > 0.35) {
    return null;
  }

  const targetBase = finalSymbols[0] === finalSymbols[1] ? finalSymbols[0] : finalSymbols[0];
  const nearMissSymbol = getAdjacentSymbol(targetBase);

  return {
    reelIndex: 2,
    previewSymbol: nearMissSymbol,
    previewDurationMs: 150,
    message: `Near miss: ${SYMBOL_DISPLAY[targetBase].label}`,
  };
}
