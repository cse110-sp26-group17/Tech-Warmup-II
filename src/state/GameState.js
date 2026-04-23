import {
  createPayoutTable,
  getRandomReelValue,
  getReelValuesForSymbol,
  reelValueToSymbolName,
  REEL_COUNT,
  WINNABLE_SYMBOL_NAMES,
} from '../constants/symbols';

const DEFAULT_INITIAL_BALANCE = 1000;
const DEFAULT_BET_AMOUNT = 10;
const MIN_BET_AMOUNT = 1;
const MAX_BET_AMOUNT = 100;
const DAILY_GRANT_AMOUNT = 250;

const TARGET_WIN_RATE = 0.35;
const LOSS_STREAK_FOR_PITY = 8;
const MILESTONE_FREE_ROLL_INTERVAL = 20;
const RANDOM_FREE_ROLL_CHANCE = 0.03;

const JACKPOT_SEED_AMOUNT = 500;
const JACKPOT_CONTRIBUTION_RATE = 0.02;

const MAX_TOP_WINS = 3;
const MAX_RECENT_RESULTS = 10;
const MAX_PERSISTED_HISTORY = 150;
const MAX_PERSISTED_WIN_LOG = 40;

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function toSortedTopWins(entries) {
  return [...entries]
    .filter((entry) => isFiniteNumber(entry?.payout))
    .sort((first, second) => second.payout - first.payout)
    .slice(0, MAX_TOP_WINS);
}

function createRandomReels() {
  return Array.from({ length: REEL_COUNT }, () => getRandomReelValue());
}

/**
 * Manages slot machine game state and core state transitions.
 */
class GameState {
  /**
   * @param {number} [initialBalance=1000] - Starting credit balance.
   */
  constructor(initialBalance = DEFAULT_INITIAL_BALANCE) {
    this.balance = initialBalance;
    this.betAmount = DEFAULT_BET_AMOUNT;
    this.minBetAmount = MIN_BET_AMOUNT;
    this.maxBetAmount = MAX_BET_AMOUNT;

    this.gameHistory = [];
    this.winLog = [];
    this.topWins = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;

    this.lastDailyGrantDate = null;
    this.dailyGrantAmount = DAILY_GRANT_AMOUNT;

    this.freeRollsAvailable = 0;
    this.freeRollReason = null;

    this.totalSpins = 0;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.recentResults = [];

    this.forceWinNextSpin = false;
    this.forceWinReason = null;

    this.progressiveJackpotPool = JACKPOT_SEED_AMOUNT;
    this.jackpotSeedAmount = JACKPOT_SEED_AMOUNT;
    this.jackpotContributionRate = JACKPOT_CONTRIBUTION_RATE;

    this.targetWinRate = TARGET_WIN_RATE;
    this.isSpinning = false;
    this.payoutTable = createPayoutTable();
  }

  /**
   * Executes a single reel spin, deducting the bet or consuming a free roll.
   * @param {number} betAmount - Credits to wager.
   * @param {{useFreeRoll?: boolean}} [options={}]
   * @returns {{reels: number[], balance: number, betAmount: number, wasForcedWin: boolean, usedFreeRoll: boolean, result: object}}
   * @throws {Error} If a spin is already in progress, bet is invalid, balance is insufficient, or no free rolls remain.
   */
  spin(betAmount, { useFreeRoll = false } = {}) {
    if (this.isSpinning) {
      throw new Error('Spin already in progress');
    }

    this.validateBetAmount(betAmount);

    if (!useFreeRoll && betAmount > this.balance) {
      throw new Error('Insufficient balance for bet');
    }

    if (useFreeRoll && this.freeRollsAvailable <= 0) {
      throw new Error('No free rolls available');
    }

    this.isSpinning = true;

    try {
      const wasForcedWin = this.forceWinNextSpin;
      const reels = this.generateSpinReels({ forceWin: wasForcedWin });

      if (wasForcedWin) {
        this.clearForcedWin();
      }

      const usedFreeRoll = useFreeRoll && this.consumeFreeRoll();
      if (!usedFreeRoll) {
        this.balance -= betAmount;
      }

      const spinRecord = {
        betAmount,
        reels,
        timestamp: Date.now(),
        wasForcedWin,
        usedFreeRoll,
      };
      this.gameHistory.push(spinRecord);

      const result = this.evaluateSpin(reels, betAmount);
      spinRecord.result = result;

      return {
        reels,
        balance: this.balance,
        betAmount,
        wasForcedWin,
        usedFreeRoll,
        result,
      };
    } finally {
      this.isSpinning = false;
    }
  }

  /**
   * Awards one free roll and records the reason.
   * @param {string} [reason='random'] - Why the free roll was awarded.
   * @returns {number} Updated count of available free rolls.
   */
  awardFreeRoll(reason = 'random') {
    this.freeRollsAvailable += 1;
    this.freeRollReason = reason;
    return this.freeRollsAvailable;
  }

  /**
   * Consumes one free roll if available.
   * @returns {boolean} True if a free roll was consumed, false if none were available.
   */
  consumeFreeRoll() {
    if (this.freeRollsAvailable <= 0) {
      return false;
    }

    this.freeRollsAvailable -= 1;

    if (this.freeRollsAvailable === 0) {
      this.freeRollReason = null;
    }

    return true;
  }

  /**
   * Returns the number of free rolls currently available.
   * @returns {number}
   */
  getFreeRollCount() {
    return this.freeRollsAvailable;
  }

  /**
   * Updates the active bet amount.
   * @param {number} newBetAmount - New bet value; must be within limits and <= current balance.
   * @returns {number} The updated bet amount.
   * @throws {Error} If the bet is invalid or exceeds the current balance.
   */
  updateBet(newBetAmount) {
    this.validateBetAmount(newBetAmount);

    if (newBetAmount > this.balance) {
      throw new Error('Insufficient balance for bet');
    }

    this.betAmount = newBetAmount;
    return this.betAmount;
  }

  /**
   * Returns the current credit balance.
   * @returns {number}
   */
  getBalance() {
    return this.balance;
  }

  /**
   * Returns a shallow copy of the full game history array.
   * @returns {object[]}
   */
  getGameHistory() {
    return [...this.gameHistory];
  }

  /**
   * Returns a shallow copy of the win log array.
   * @returns {object[]}
   */
  getWinLog() {
    return [...this.winLog];
  }

  /**
   * Returns total credits won across all sessions.
   * @returns {number}
   */
  getLifetimeWinnings() {
    return this.lifetimeWinnings;
  }

  /**
   * Returns the single biggest win record, or null if none.
   * @returns {{payout: number, multiplier: number, symbolName: string, betAmount: number, timestamp: number} | null}
   */
  getBiggestWin() {
    return this.biggestWin;
  }

  /**
   * Returns a shallow copy of the top-3 wins array.
   * @returns {object[]}
   */
  getTopWins() {
    return [...this.topWins];
  }

  /**
   * Returns the full payout table configuration object.
   * @returns {object}
   */
  getPayoutTable() {
    return this.payoutTable;
  }

  /**
   * Estimates the theoretical return-to-player percentage.
   * @returns {number} Estimated RTP as a decimal (e.g. 0.85 = 85%).
   */
  calculateRTP() {
    const averageWinMultiplier =
      this.payoutTable.cherry.multiplier * this.payoutTable.cherry.probability +
      this.payoutTable.bar.multiplier * this.payoutTable.bar.probability +
      this.payoutTable.bell.multiplier * this.payoutTable.bell.probability +
      this.payoutTable.seven.multiplier * this.payoutTable.seven.probability;

    const baseRtp = this.targetWinRate * averageWinMultiplier;
    const estimatedComboBoost = 0.04;
    const estimatedPityBoost = 0.025;
    const estimatedMilestoneBoost = 0.008;

    return baseRtp + estimatedComboBoost + estimatedPityBoost + estimatedMilestoneBoost;
  }

  /**
   * Maps a raw reel integer (0-9) to a symbol name string.
   * @param {number} reelNumber - Raw reel value.
   * @returns {'cherry' | 'bar' | 'bell' | 'seven' | 'none'}
   */
  getSymbolName(reelNumber) {
    return reelValueToSymbolName(reelNumber);
  }

  /**
   * Returns the base payout multiplier for a symbol name.
   * @param {string} symbolName - Key into the payout table.
   * @returns {number} Multiplier, or 0 if the symbol is not in the table.
   */
  getSymbolMultiplier(symbolName) {
    const symbol = this.payoutTable[symbolName];
    if (!symbol) {
      return 0;
    }
    return symbol.multiplier;
  }

  /**
   * Returns the tier multiplier applied based on the number of matching reels.
   * @param {number} matchCount - Number of consecutive left-to-right matching symbols.
   * @returns {number} 3 for 5-match, 1.8 for 4-match, 1 otherwise.
   */
  getMatchTierMultiplier(matchCount) {
    if (matchCount >= 5) {
      return 3;
    }
    if (matchCount === 4) {
      return 1.8;
    }
    return 1;
  }

  /**
   * Evaluates a set of reel values and returns the spin outcome.
   * @param {number[]} reels - Array of 5 raw reel values.
   * @param {number} [betAmount=this.betAmount] - Bet used to compute the payout.
   * @returns {{isWin: boolean, symbolName: string, multiplier: number, payout: number, matchCount: number}}
   */
  evaluateSpin(reels, betAmount = this.betAmount) {
    const symbolNames = Array.isArray(reels) ? reels.map((value) => this.getSymbolName(value)) : [];
    const firstSymbol = symbolNames[0] ?? 'none';
    let matchCount = symbolNames.length > 0 ? 1 : 0;

    for (let index = 1; index < symbolNames.length; index += 1) {
      if (symbolNames[index] === firstSymbol) {
        matchCount += 1;
      } else {
        break;
      }
    }

    const baseMultiplier = this.getSymbolMultiplier(firstSymbol);
    const tierMultiplier = this.getMatchTierMultiplier(matchCount);
    const isWin = matchCount >= 3 && baseMultiplier > 0;
    const symbolName = isWin ? firstSymbol : 'none';
    const multiplier = isWin ? Number((baseMultiplier * tierMultiplier).toFixed(2)) : 0;
    const payout = isWin ? Math.round(multiplier * betAmount) : 0;

    return {
      isWin,
      symbolName,
      multiplier,
      payout,
      matchCount,
    };
  }

  /**
   * Runs a full spin cycle including combo bonuses, jackpot, milestones, streaks, and free rolls.
   * @param {number} betAmount - Credits to wager.
   * @returns {{reels: number[], balance: number, betAmount: number, result: object, totalSpins: number, streaks: {wins: number, losses: number}, jackpotPool: number, nextMilestoneIn: number, machineTemperature: object, shouldShowDueForWin: boolean, luckBuilding: boolean, freeRollsAvailable: number, freeRollAwarded: string | null, usedFreeRoll: boolean}}
   */
  spinWithPayout(betAmount) {
    const shouldUseFreeRoll = this.freeRollsAvailable > 0;
    const jackpotContribution = shouldUseFreeRoll
      ? 0
      : Number((betAmount * this.jackpotContributionRate).toFixed(2));

    this.progressiveJackpotPool += jackpotContribution;

    const spinResult = this.spin(betAmount, { useFreeRoll: shouldUseFreeRoll });
    this.totalSpins += 1;

    const outcome = {
      ...spinResult.result,
      comboMultiplier: 1,
      comboBonus: 0,
      jackpotBonus: 0,
      milestoneBonus: 0,
      totalPayout: spinResult.result.payout,
      milestoneType: null,
      wasForcedWin: spinResult.wasForcedWin,
      usedFreeRoll: spinResult.usedFreeRoll,
      freeRollAwarded: null,
    };

    if (spinResult.result.isWin) {
      this.applyWinningOutcome(spinResult, outcome, betAmount);
    } else {
      this.applyLosingOutcome();
    }

    this.applyMilestoneBonus(outcome);
    this.applyFreeRollTriggers(outcome);

    spinResult.result = outcome;

    if (this.gameHistory.length > 0) {
      this.gameHistory[this.gameHistory.length - 1].result = outcome;
    }

    return {
      reels: spinResult.reels,
      balance: this.balance,
      betAmount: spinResult.betAmount,
      result: outcome,
      totalSpins: this.totalSpins,
      streaks: {
        wins: this.currentWinStreak,
        losses: this.currentLossStreak,
      },
      jackpotPool: this.progressiveJackpotPool,
      nextMilestoneIn: this.getNextMilestoneIn(),
      machineTemperature: this.getMachineTemperature(),
      shouldShowDueForWin: this.currentLossStreak >= 3,
      luckBuilding: this.currentLossStreak >= 5,
      freeRollsAvailable: this.freeRollsAvailable,
      freeRollAwarded: outcome.freeRollAwarded,
      usedFreeRoll: outcome.usedFreeRoll,
    };
  }

  /**
   * Returns whether the daily credit grant is available to claim today.
   * @returns {boolean}
   */
  canClaimDailyGrant() {
    return this.lastDailyGrantDate !== this.getTodayKey();
  }

  /**
   * Claims the daily credit grant and adds it to the balance.
   * @returns {{amount: number, balance: number, lastClaimDate: string}}
   * @throws {Error} If the daily grant has already been claimed today.
   */
  claimDailyGrant() {
    const todayKey = this.getTodayKey();
    if (this.lastDailyGrantDate === todayKey) {
      throw new Error('Daily VC already claimed today');
    }

    this.lastDailyGrantDate = todayKey;
    this.balance += this.dailyGrantAmount;

    return {
      amount: this.dailyGrantAmount,
      balance: this.balance,
      lastClaimDate: todayKey,
    };
  }

  /**
   * Restores the last daily grant date from a persisted string key.
   * @param {string | *} dateKey - ISO date string (YYYY-MM-DD) or any non-string value to reset.
   */
  hydrateDailyGrantDate(dateKey) {
    this.lastDailyGrantDate = typeof dateKey === 'string' ? dateKey : null;
  }

  /**
   * Returns the date key of the last daily grant claim.
   * @returns {string | null}
   */
  getLastDailyGrantDate() {
    return this.lastDailyGrantDate;
  }

  /**
   * Returns the payout multiplier for the current consecutive win streak.
   * @param {number} winStreak - Number of consecutive wins.
   * @returns {number} 2 for 5+, 1.5 for 3-4, 1.2 for 2, 1 otherwise.
   */
  getComboMultiplier(winStreak) {
    if (winStreak >= 5) {
      return 2;
    }
    if (winStreak >= 3) {
      return 1.5;
    }
    if (winStreak >= 2) {
      return 1.2;
    }
    return 1;
  }

  /**
   * Returns the milestone bonus for a given spin count.
   * @param {number} totalSpins - Lifetime spin count to evaluate.
   * @returns {{amount: number, type: 'major' | 'medium' | 'minor' | null}}
   */
  getMilestoneReward(totalSpins) {
    if (totalSpins > 0 && totalSpins % 50 === 0) {
      return { amount: 500, type: 'major' };
    }
    if (totalSpins > 0 && totalSpins % 25 === 0) {
      return { amount: 150, type: 'medium' };
    }
    if (totalSpins > 0 && totalSpins % 10 === 0) {
      return { amount: 50, type: 'minor' };
    }
    return { amount: 0, type: null };
  }

  /**
   * Returns the number of spins until the next milestone reward.
   * @returns {number}
   */
  getNextMilestoneIn() {
    const spinsWithinCycle = this.totalSpins % 50;

    if (spinsWithinCycle < 10) {
      return 10 - spinsWithinCycle;
    }

    if (spinsWithinCycle < 25) {
      return 25 - spinsWithinCycle;
    }

    return 50 - spinsWithinCycle;
  }

  /**
   * Appends a win/loss boolean to the recent results window (max 10 entries).
   * @param {boolean} isWin - True for a winning spin, false for a loss.
   */
  pushRecentResult(isWin) {
    this.recentResults.push(isWin);
    if (this.recentResults.length > MAX_RECENT_RESULTS) {
      this.recentResults.shift();
    }
  }

  /**
   * Inserts a win entry into the sorted top-3 wins list.
   * @param {{payout: number, multiplier: number, symbolName: string, comboMultiplier: number, betAmount: number, timestamp: number}} entry
   */
  recordTopWin(entry) {
    this.topWins = toSortedTopWins([...this.topWins, entry]);
  }

  /**
   * Computes a temperature label based on win frequency over the last 10 spins.
   * @returns {{label: string, tone: 'fire' | 'hot' | 'warm' | 'cold'}}
   */
  getMachineTemperature() {
    const winsInLastTen = this.recentResults.filter(Boolean).length;

    if (winsInLastTen >= 4) {
      return { label: 'ON FIRE', tone: 'fire' };
    }
    if (winsInLastTen >= 3) {
      return { label: 'HOT', tone: 'hot' };
    }
    if (winsInLastTen >= 2) {
      return { label: 'WARM', tone: 'warm' };
    }
    return { label: 'COLD', tone: 'cold' };
  }

  /**
   * Returns a snapshot of transient game meta fields (streaks, jackpot, temperature, etc.).
   * @returns {{totalSpins: number, currentWinStreak: number, currentLossStreak: number, progressiveJackpotPool: number, nextMilestoneIn: number, machineTemperature: object, comboMultiplier: number, forceWinNextSpin: boolean, forceWinReason: string | null, freeRollsAvailable: number, freeRollReason: string | null}}
   */
  getMetaState() {
    return {
      totalSpins: this.totalSpins,
      currentWinStreak: this.currentWinStreak,
      currentLossStreak: this.currentLossStreak,
      progressiveJackpotPool: this.progressiveJackpotPool,
      nextMilestoneIn: this.getNextMilestoneIn(),
      machineTemperature: this.getMachineTemperature(),
      comboMultiplier: this.getComboMultiplier(this.currentWinStreak),
      forceWinNextSpin: this.forceWinNextSpin,
      forceWinReason: this.forceWinReason,
      freeRollsAvailable: this.freeRollsAvailable,
      freeRollReason: this.freeRollReason,
    };
  }

  /**
   * Returns a serializable state object suitable for localStorage persistence.
   * @returns {object}
   */
  getPersistenceState() {
    return {
      balance: this.balance,
      betAmount: this.betAmount,
      gameHistory: this.gameHistory.slice(-MAX_PERSISTED_HISTORY),
      winLog: this.winLog.slice(0, MAX_PERSISTED_WIN_LOG),
      topWins: this.topWins.slice(0, MAX_TOP_WINS),
      lifetimeWinnings: this.lifetimeWinnings,
      biggestWin: this.biggestWin,
      lastDailyGrantDate: this.lastDailyGrantDate,
      totalSpins: this.totalSpins,
      currentWinStreak: this.currentWinStreak,
      currentLossStreak: this.currentLossStreak,
      recentResults: this.recentResults,
      progressiveJackpotPool: this.progressiveJackpotPool,
      forceWinNextSpin: this.forceWinNextSpin,
      forceWinReason: this.forceWinReason,
      freeRollsAvailable: this.freeRollsAvailable,
      freeRollReason: this.freeRollReason,
    };
  }

  /**
   * Restores game state from a previously persisted plain object.
   * @param {object} state - Saved state; invalid or missing fields fall back to defaults.
   */
  hydrateFromState(state) {
    if (!state || typeof state !== 'object') {
      return;
    }

    this.balance = isFiniteNumber(state.balance) ? state.balance : this.balance;
    this.betAmount = isFiniteNumber(state.betAmount) ? state.betAmount : this.betAmount;
    this.gameHistory = Array.isArray(state.gameHistory) ? [...state.gameHistory] : [];
    this.winLog = Array.isArray(state.winLog) ? [...state.winLog] : [];
    this.topWins = Array.isArray(state.topWins) ? toSortedTopWins(state.topWins) : [];

    this.lifetimeWinnings = isFiniteNumber(state.lifetimeWinnings) ? state.lifetimeWinnings : 0;
    this.biggestWin = this.topWins[0] ?? state.biggestWin ?? null;

    this.lastDailyGrantDate = typeof state.lastDailyGrantDate === 'string' ? state.lastDailyGrantDate : null;
    this.totalSpins = isFiniteNumber(state.totalSpins) ? state.totalSpins : 0;
    this.currentWinStreak = isFiniteNumber(state.currentWinStreak) ? state.currentWinStreak : 0;
    this.currentLossStreak = isFiniteNumber(state.currentLossStreak) ? state.currentLossStreak : 0;

    this.recentResults = Array.isArray(state.recentResults) ? state.recentResults.slice(-MAX_RECENT_RESULTS) : [];

    this.progressiveJackpotPool = isFiniteNumber(state.progressiveJackpotPool)
      ? state.progressiveJackpotPool
      : this.jackpotSeedAmount;

    this.forceWinNextSpin = state.forceWinNextSpin === true;
    this.forceWinReason = typeof state.forceWinReason === 'string' ? state.forceWinReason : null;

    this.freeRollsAvailable = isFiniteNumber(state.freeRollsAvailable)
      ? Math.max(0, state.freeRollsAvailable)
      : 0;
    this.freeRollReason = typeof state.freeRollReason === 'string' ? state.freeRollReason : null;
  }

  /**
   * Resets all game state to initial values.
   * @param {number} [newInitialBalance=1000] - Balance to start fresh with.
   */
  resetGame(newInitialBalance = DEFAULT_INITIAL_BALANCE) {
    this.balance = newInitialBalance;
    this.betAmount = DEFAULT_BET_AMOUNT;

    this.gameHistory = [];
    this.winLog = [];
    this.topWins = [];

    this.lifetimeWinnings = 0;
    this.biggestWin = null;

    this.lastDailyGrantDate = null;

    this.totalSpins = 0;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.recentResults = [];

    this.forceWinNextSpin = false;
    this.forceWinReason = null;

    this.freeRollsAvailable = 0;
    this.freeRollReason = null;

    this.progressiveJackpotPool = this.jackpotSeedAmount;
    this.isSpinning = false;
  }

  /**
   * Generates five raw reel values, forcing a win when requested or by probability.
   * @param {{forceWin?: boolean}} [options={}]
   * @returns {number[]} Array of 5 reel integers.
   */
  generateSpinReels({ forceWin = false } = {}) {
    if (forceWin || Math.random() < this.targetWinRate) {
      return this.generateWinningReels();
    }

    return this.generateLosingReels();
  }

  /**
   * Generates a winning 5-reel combination for a randomly chosen symbol.
   * @returns {number[]} Array of 5 reel integers with 3-5 leading matches.
   */
  generateWinningReels() {
    const winningSymbol = this.pickWinningSymbol();
    const reelValuesForSymbol = this.getReelValuesForSymbol(winningSymbol);
    const pickWinningValue = () =>
      reelValuesForSymbol[Math.floor(Math.random() * reelValuesForSymbol.length)];

    const matchLengthRoll = Math.random();
    const matchLength = matchLengthRoll < 0.08 ? 5 : matchLengthRoll < 0.25 ? 4 : 3;
    const reels = [];

    for (let index = 0; index < matchLength; index += 1) {
      reels.push(pickWinningValue());
    }

    while (reels.length < REEL_COUNT) {
      reels.push(getRandomReelValue());
    }

    for (let index = matchLength; index < REEL_COUNT; index += 1) {
      while (this.getSymbolName(reels[index]) === winningSymbol) {
        reels[index] = getRandomReelValue();
      }
    }

    return reels;
  }

  /**
   * Generates a guaranteed non-winning 5-reel combination.
   * @returns {number[]} Array of 5 reel integers that evaluate to no win.
   */
  generateLosingReels() {
    let reels = createRandomReels();

    while (this.evaluateSpin(reels, this.betAmount).isWin) {
      reels = createRandomReels();
    }

    return reels;
  }

  /**
   * Picks a winning symbol by weighted random selection from the payout table.
   * @returns {'cherry' | 'bar' | 'bell' | 'seven'}
   */
  pickWinningSymbol() {
    const randomRoll = Math.random();
    let cumulativeProbability = 0;

    for (const symbolName of WINNABLE_SYMBOL_NAMES) {
      cumulativeProbability += this.payoutTable[symbolName].probability;
      if (randomRoll <= cumulativeProbability) {
        return symbolName;
      }
    }

    return 'cherry';
  }

  /**
   * Returns the valid raw reel integer values that map to the given symbol.
   * @param {string} symbolName - Symbol key (e.g. 'cherry', 'bar', 'bell', 'seven').
   * @returns {number[]} Array of one or two reel integers.
   */
  getReelValuesForSymbol(symbolName) {
    return [...getReelValuesForSymbol(symbolName)];
  }

  /**
   * Returns today's date as a YYYY-MM-DD string in local time.
   * @returns {string}
   */
  getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * @param {number} betAmount
   * @throws {Error}
   */
  validateBetAmount(betAmount) {
    if (!isFiniteNumber(betAmount)) {
      throw new Error('Bet amount must be a valid number');
    }

    if (betAmount < this.minBetAmount) {
      throw new Error(`Bet amount must be at least ${this.minBetAmount}`);
    }

    if (betAmount > this.maxBetAmount) {
      throw new Error(`Bet amount must be at most ${this.maxBetAmount}`);
    }
  }

  clearForcedWin() {
    this.forceWinNextSpin = false;
    this.forceWinReason = null;
  }

  /**
   * @param {{result: {payout: number, multiplier: number, symbolName: string}, wasForcedWin: boolean}} spinResult
   * @param {{comboMultiplier: number, comboBonus: number, jackpotBonus: number, totalPayout: number}} outcome
   * @param {number} betAmount
   */
  applyWinningOutcome(spinResult, outcome, betAmount) {
    const winTimestamp = Date.now();

    this.currentWinStreak += 1;
    this.currentLossStreak = 0;

    const comboMultiplier = this.getComboMultiplier(this.currentWinStreak);
    const comboBonus = Math.round(spinResult.result.payout * (comboMultiplier - 1));

    outcome.comboMultiplier = comboMultiplier;
    outcome.comboBonus = comboBonus;
    outcome.totalPayout += comboBonus;

    if (spinResult.result.symbolName === 'seven') {
      const jackpotWin = Math.floor(this.progressiveJackpotPool);
      outcome.jackpotBonus = jackpotWin;
      outcome.totalPayout += jackpotWin;
      this.progressiveJackpotPool = this.jackpotSeedAmount;
    }

    this.balance += outcome.totalPayout;
    this.lifetimeWinnings += outcome.totalPayout;

    const winEntry = {
      payout: outcome.totalPayout,
      multiplier: spinResult.result.multiplier,
      symbolName: spinResult.result.symbolName,
      comboMultiplier: outcome.comboMultiplier,
      betAmount,
      timestamp: winTimestamp,
    };

    this.winLog.unshift({
      payout: winEntry.payout,
      multiplier: winEntry.multiplier,
      symbolName: winEntry.symbolName,
      comboMultiplier: winEntry.comboMultiplier,
      timestamp: winEntry.timestamp,
    });

    if (!this.biggestWin || outcome.totalPayout > this.biggestWin.payout) {
      this.biggestWin = {
        payout: winEntry.payout,
        multiplier: winEntry.multiplier,
        symbolName: winEntry.symbolName,
        betAmount,
        timestamp: winEntry.timestamp,
      };
    }

    this.recordTopWin(winEntry);
    this.pushRecentResult(true);
  }

  applyLosingOutcome() {
    this.currentLossStreak += 1;
    this.currentWinStreak = 0;
    this.pushRecentResult(false);

    if (this.currentLossStreak >= LOSS_STREAK_FOR_PITY) {
      this.forceWinNextSpin = true;
      this.forceWinReason = 'pity';
    }
  }

  /**
   * @param {{milestoneBonus: number, milestoneType: 'major' | 'medium' | 'minor' | null}} outcome
   */
  applyMilestoneBonus(outcome) {
    const milestone = this.getMilestoneReward(this.totalSpins);
    if (milestone.amount <= 0) {
      return;
    }

    outcome.milestoneBonus = milestone.amount;
    outcome.milestoneType = milestone.type;

    this.balance += milestone.amount;
    this.lifetimeWinnings += milestone.amount;

    this.winLog.unshift({
      payout: milestone.amount,
      multiplier: 0,
      symbolName: 'bonus',
      comboMultiplier: 1,
      timestamp: Date.now(),
    });

    if (milestone.type === 'major') {
      this.forceWinNextSpin = true;
      this.forceWinReason = 'milestone';
    }
  }

  /**
   * @param {{freeRollAwarded: string | null}} outcome
   */
  applyFreeRollTriggers(outcome) {
    const freeRollTriggers = [];

    if (this.totalSpins > 0 && this.totalSpins % MILESTONE_FREE_ROLL_INTERVAL === 0) {
      freeRollTriggers.push('milestone');
    }

    if (this.currentLossStreak >= LOSS_STREAK_FOR_PITY && this.forceWinNextSpin) {
      freeRollTriggers.push('consolation');
    }

    if (Math.random() < RANDOM_FREE_ROLL_CHANCE) {
      freeRollTriggers.push('random');
    }

    if (freeRollTriggers.length === 0) {
      return;
    }

    const primaryTrigger = freeRollTriggers[0];
    this.awardFreeRoll(primaryTrigger);
    outcome.freeRollAwarded = primaryTrigger;
  }
}

export default GameState;
