export const REEL_MIN_VALUE = 0;
export const REEL_MAX_VALUE = 9;
export const REEL_COUNT = 5;

export const SYMBOL_DEFINITIONS = Object.freeze({
  cherry: Object.freeze({
    label: 'Cherry',
    code: '🍒',
    reelValues: Object.freeze([0, 1]),
    multiplier: 1.4,
    probability: 0.45,
  }),
  bar: Object.freeze({
    label: 'Lemon',
    code: '🍋',
    reelValues: Object.freeze([2, 3]),
    multiplier: 2.3,
    probability: 0.3,
  }),
  bell: Object.freeze({
    label: 'Bell',
    code: '🔔',
    reelValues: Object.freeze([4, 5]),
    multiplier: 4.3,
    probability: 0.17,
  }),
  seven: Object.freeze({
    label: 'Seven',
    code: '7️⃣',
    reelValues: Object.freeze([6, 7]),
    multiplier: 9.5,
    probability: 0.08,
  }),
  none: Object.freeze({
    label: 'Star',
    code: '⭐',
    reelValues: Object.freeze([8, 9]),
    multiplier: 0,
    probability: 0,
  }),
  bonus: Object.freeze({
    label: 'Bonus',
    code: '🎁',
    reelValues: Object.freeze([]),
    multiplier: 0,
    probability: 0,
  }),
});

export const WINNABLE_SYMBOL_NAMES = Object.freeze(['cherry', 'bar', 'bell', 'seven']);
export const REEL_SYMBOL_ORDER = Object.freeze(['cherry', 'bar', 'bell', 'seven', 'none']);

const REEL_VALUE_TO_SYMBOL = Object.freeze(
  Object.entries(SYMBOL_DEFINITIONS).reduce((mapping, [symbolName, symbolConfig]) => {
    symbolConfig.reelValues.forEach((reelValue) => {
      mapping[reelValue] = symbolName;
    });
    return mapping;
  }, {})
);

export const SYMBOL_DISPLAY = Object.freeze(
  Object.fromEntries(
    Object.entries(SYMBOL_DEFINITIONS).map(([symbolName, symbolConfig]) => [
      symbolName,
      Object.freeze({
        label: symbolConfig.label,
        code: symbolConfig.code,
      }),
    ])
  )
);

export const PAYOUT_TABLE = Object.freeze(
  Object.fromEntries(
    Object.entries(SYMBOL_DEFINITIONS).map(([symbolName, symbolConfig]) => [
      symbolName,
      Object.freeze({
        multiplier: symbolConfig.multiplier,
        probability: symbolConfig.probability,
      }),
    ])
  )
);

export function reelValueToSymbolName(reelValue) {
  return REEL_VALUE_TO_SYMBOL[reelValue] ?? 'none';
}

export function getReelValuesForSymbol(symbolName) {
  const symbol = SYMBOL_DEFINITIONS[symbolName];
  if (!symbol || symbol.reelValues.length === 0) {
    return SYMBOL_DEFINITIONS.none.reelValues;
  }
  return symbol.reelValues;
}

export function createPayoutTable() {
  return Object.fromEntries(
    Object.entries(PAYOUT_TABLE).map(([symbolName, symbolConfig]) => [
      symbolName,
      {
        multiplier: symbolConfig.multiplier,
        probability: symbolConfig.probability,
      },
    ])
  );
}

export function getRandomReelValue(randomFn = Math.random) {
  return Math.floor(randomFn() * (REEL_MAX_VALUE + 1));
}
