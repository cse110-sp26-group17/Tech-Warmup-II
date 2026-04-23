/**
 * Manages slot machine game state and core state transitions.
 */
class GameState {
  /**
   * @param {number} [initialBalance=1000] - Starting credit balance.
   */
  constructor(initialBalance = 1000) {
    this.balance = initialBalance;
    this.betAmount = 10;
    this.gameHistory = [];
    this.winLog = [];
    this.topWins = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;
    this.lastDailyGrantDate = null;
    this.dailyGrantAmount = 250;
    this.freeRollsAvailable = 0;
    this.freeRollReason = null;

    this.totalSpins = 0;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.recentResults = [];
    this.forceWinNextSpin = false;
    this.forceWinReason = null;

    this.progressiveJackpotPool = 500;
    this.jackpotSeedAmount = 500;
    this.jackpotContributionRate = 0.02;

    // Five-reel left-to-right matching needs a slightly higher target hit rate.
    this.targetWinRate = 0.35;
    this.isSpinning = false;
    this.payoutTable = {
      cherry: { multiplier: 1.4, probability: 0.45 },
      bar: { multiplier: 2.3, probability: 0.3 },
      bell: { multiplier: 4.3, probability: 0.17 },
      seven: { multiplier: 9.5, probability: 0.08 },
      none: { multiplier: 0, probability: 0 },
    };
  }

  /**
   * Executes a single reel spin, deducting the bet or consuming a free roll.
   * @param {number} betAmount - Credits to wager.
   * @param {{useFreeRoll?: boolean}} [options={}]
   * @returns {{reels: number[], balance: number, betAmount: number, wasForcedWin: boolean, usedFreeRoll: boolean, result: object}}
   * @throws {Error} If a spin is already in progress, bet is invalid, balance is insufficient, or no free rolls remain.
   */
  spin(betAmount, { useFreeRoll = false } = {}) {
    if (this.isSpinning === true) {
      throw new Error('Spin already in progress');
    }
    if (!Number.isFinite(betAmount)) {
      throw new Error('Bet amount must be a valid number');
    }
    if (betAmount < 1) {
      throw new Error('Bet amount must be at least 1');
    }
    if (!useFreeRoll && betAmount > this.balance) {
      throw new Error('Insufficient balance for bet');
    }
    if (useFreeRoll && this.freeRollsAvailable <= 0) {
      throw new Error('No free rolls available');
    }

    this.isSpinning = true;

    const wasForcedWin = this.forceWinNextSpin;
    const reels = this.generateSpinReels({ forceWin: wasForcedWin });

    if (wasForcedWin) {
      this.forceWinNextSpin = false;
      this.forceWinReason = null;
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

    const evalResult = this.evaluateSpin(reels, betAmount);
    spinRecord.result = evalResult;

    this.isSpinning = false;

    return {
      reels,
      balance: this.balance,
      betAmount,
      wasForcedWin,
      usedFreeRoll,
      result: evalResult,
    };
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
   * @param {number} newBetAmount - New bet value; must be >= 1 and <= current balance.
   * @returns {number} The updated bet amount.
   * @throws {Error} If the bet is below 1 or exceeds the current balance.
   */
  updateBet(newBetAmount) {
    if (newBetAmount < 1) {
      throw new Error('Bet amount must be at least 1');
    }
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
   * Maps a raw reel integer (0–9) to a symbol name string.
   * @param {number} reelNumber - Raw reel value.
   * @returns {'cherry' | 'bar' | 'bell' | 'seven' | 'none'}
   */
  getSymbolName(reelNumber) {
    if (reelNumber >= 0 && reelNumber <= 1) {
      return 'cherry';
    }
    if (reelNumber >= 2 && reelNumber <= 3) {
      return 'bar';
    }
    if (reelNumber >= 4 && reelNumber <= 5) {
      return 'bell';
    }
    if (reelNumber >= 6 && reelNumber <= 7) {
      return 'seven';
    }
    return 'none';
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
    const symbols = reels.map((reelValue) => this.getSymbolName(reelValue));
    const firstSymbol = symbols[0];
    let matchCount = 1;

    for (let index = 1; index < symbols.length; index += 1) {
      if (symbols[index] === firstSymbol) {
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

    const result = {
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

    if (spinResult.result.isWin === true) {
      const winTimestamp = Date.now();
      this.currentWinStreak += 1;
      this.currentLossStreak = 0;

      const comboMultiplier = this.getComboMultiplier(this.currentWinStreak);
      const comboBonus = Math.round(spinResult.result.payout * (comboMultiplier - 1));

      result.comboMultiplier = comboMultiplier;
      result.comboBonus = comboBonus;
      result.totalPayout += comboBonus;

      if (spinResult.result.symbolName === 'seven') {
        const jackpotWin = Math.floor(this.progressiveJackpotPool);
        result.jackpotBonus = jackpotWin;
        result.totalPayout += jackpotWin;
        this.progressiveJackpotPool = this.jackpotSeedAmount;
      }

      this.balance += result.totalPayout;
      this.lifetimeWinnings += result.totalPayout;

      this.winLog.unshift({
        payout: result.totalPayout,
        multiplier: spinResult.result.multiplier,
        symbolName: spinResult.result.symbolName,
        comboMultiplier: result.comboMultiplier,
        timestamp: winTimestamp,
      });

      if (!this.biggestWin || result.totalPayout > this.biggestWin.payout) {
        this.biggestWin = {
          payout: result.totalPayout,
          multiplier: spinResult.result.multiplier,
          symbolName: spinResult.result.symbolName,
          betAmount,
          timestamp: winTimestamp,
        };
      }

      this.recordTopWin({
        payout: result.totalPayout,
        multiplier: spinResult.result.multiplier,
        symbolName: spinResult.result.symbolName,
        comboMultiplier: result.comboMultiplier,
        betAmount,
        timestamp: winTimestamp,
      });

      this.pushRecentResult(true);
    } else {
      this.currentLossStreak += 1;
      this.currentWinStreak = 0;
      this.pushRecentResult(false);

      if (this.currentLossStreak >= 8) {
        this.forceWinNextSpin = true;
        this.forceWinReason = 'pity';
      }
    }

    const milestone = this.getMilestoneReward(this.totalSpins);
    if (milestone.amount > 0) {
      result.milestoneBonus = milestone.amount;
      result.milestoneType = milestone.type;
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

    const freeRollTriggers = [];
    if (this.totalSpins > 0 && this.totalSpins % 20 === 0) {
      freeRollTriggers.push('milestone');
    }
    if (this.currentLossStreak >= 8 && this.forceWinNextSpin) {
      freeRollTriggers.push('consolation');
    }
    if (Math.random() < 0.03) {
      freeRollTriggers.push('random');
    }

    if (freeRollTriggers.length > 0) {
      const primaryTrigger = freeRollTriggers[0];
      this.awardFreeRoll(primaryTrigger);
      result.freeRollAwarded = primaryTrigger;
    }

    spinResult.result = result;

    if (this.gameHistory.length > 0) {
      this.gameHistory[this.gameHistory.length - 1].result = result;
    }

    return {
      reels: spinResult.reels,
      balance: this.balance,
      betAmount: spinResult.betAmount,
      result,
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
      freeRollAwarded: result.freeRollAwarded,
      usedFreeRoll: result.usedFreeRoll,
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
   * @returns {number} 2 for 5+, 1.5 for 3–4, 1.2 for 2, 1 otherwise.
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
    const withinCycle = this.totalSpins % 50;
    if (withinCycle < 10) {
      return 10 - withinCycle;
    }
    if (withinCycle < 25) {
      return 25 - withinCycle;
    }
    return 50 - withinCycle;
  }

  /**
   * Appends a win/loss boolean to the recent results window (max 10 entries).
   * @param {boolean} isWin - True for a winning spin, false for a loss.
   */
  pushRecentResult(isWin) {
    this.recentResults.push(isWin);
    if (this.recentResults.length > 10) {
      this.recentResults.shift();
    }
  }

  /**
   * Inserts a win entry into the sorted top-3 wins list.
   * @param {{payout: number, multiplier: number, symbolName: string, comboMultiplier: number, betAmount: number, timestamp: number}} entry
   */
  recordTopWin(entry) {
    this.topWins = [...this.topWins, entry]
      .filter((winEntry) => Number.isFinite(winEntry?.payout))
      .sort((first, second) => second.payout - first.payout)
      .slice(0, 3);
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
   * Returns a serialisable state object suitable for localStorage persistence.
   * @returns {object}
   */
  getPersistenceState() {
    return {
      balance: this.balance,
      betAmount: this.betAmount,
      gameHistory: this.gameHistory.slice(-150),
      winLog: this.winLog.slice(0, 40),
      topWins: this.topWins.slice(0, 3),
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

    this.balance = Number.isFinite(state.balance) ? state.balance : this.balance;
    this.betAmount = Number.isFinite(state.betAmount) ? state.betAmount : this.betAmount;
    this.gameHistory = Array.isArray(state.gameHistory) ? [...state.gameHistory] : [];
    this.winLog = Array.isArray(state.winLog) ? [...state.winLog] : [];
    this.topWins = Array.isArray(state.topWins)
      ? state.topWins
          .filter((entry) => Number.isFinite(entry?.payout))
          .sort((first, second) => second.payout - first.payout)
          .slice(0, 3)
      : [];
    this.lifetimeWinnings = Number.isFinite(state.lifetimeWinnings) ? state.lifetimeWinnings : 0;
    this.biggestWin = this.topWins[0] ?? state.biggestWin ?? null;
    this.lastDailyGrantDate = typeof state.lastDailyGrantDate === 'string' ? state.lastDailyGrantDate : null;
    this.totalSpins = Number.isFinite(state.totalSpins) ? state.totalSpins : 0;
    this.currentWinStreak = Number.isFinite(state.currentWinStreak) ? state.currentWinStreak : 0;
    this.currentLossStreak = Number.isFinite(state.currentLossStreak) ? state.currentLossStreak : 0;
    this.recentResults = Array.isArray(state.recentResults) ? state.recentResults.slice(-10) : [];
    this.progressiveJackpotPool = Number.isFinite(state.progressiveJackpotPool)
      ? state.progressiveJackpotPool
      : this.jackpotSeedAmount;
    this.forceWinNextSpin = state.forceWinNextSpin === true;
    this.forceWinReason = typeof state.forceWinReason === 'string' ? state.forceWinReason : null;
    this.freeRollsAvailable = Number.isFinite(state.freeRollsAvailable) ? Math.max(0, state.freeRollsAvailable) : 0;
    this.freeRollReason = typeof state.freeRollReason === 'string' ? state.freeRollReason : null;
  }

  /**
   * Resets all game state to initial values.
   * @param {number} [newInitialBalance=1000] - Balance to start fresh with.
   */
  resetGame(newInitialBalance = 1000) {
    this.balance = newInitialBalance;
    this.betAmount = 10;
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
   * @returns {number[]} Array of 5 reel integers with 3–5 leading matches.
   */
  generateWinningReels() {
    const winningSymbol = this.pickWinningSymbol();
    const reelValues = this.getReelValuesForSymbol(winningSymbol);
    const pickValue = () => reelValues[Math.floor(Math.random() * reelValues.length)];
    const matchLengthRoll = Math.random();
    const matchLength = matchLengthRoll < 0.08 ? 5 : matchLengthRoll < 0.25 ? 4 : 3;
    const reels = [];

    for (let index = 0; index < matchLength; index += 1) {
      reels.push(pickValue());
    }

    while (reels.length < 5) {
      reels.push(Math.floor(Math.random() * 10));
    }

    for (let index = matchLength; index < 5; index += 1) {
      while (this.getSymbolName(reels[index]) === winningSymbol) {
        reels[index] = Math.floor(Math.random() * 10);
      }
    }

    return reels;
  }

  /**
   * Generates a guaranteed non-winning 5-reel combination.
   * @returns {number[]} Array of 5 reel integers that evaluate to no win.
   */
  generateLosingReels() {
    let reels = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];

    while (this.evaluateSpin(reels, this.betAmount).isWin) {
      reels = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ];
    }

    return reels;
  }

  /**
   * Picks a winning symbol by weighted random selection from the payout table.
   * @returns {'cherry' | 'bar' | 'bell' | 'seven'}
   */
  pickWinningSymbol() {
    const random = Math.random();
    let cumulative = 0;

    const symbols = ['cherry', 'bar', 'bell', 'seven'];
    for (const symbolName of symbols) {
      cumulative += this.payoutTable[symbolName].probability;
      if (random <= cumulative) {
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
    if (symbolName === 'cherry') {
      return [0, 1];
    }
    if (symbolName === 'bar') {
      return [2, 3];
    }
    if (symbolName === 'bell') {
      return [4, 5];
    }
    if (symbolName === 'seven') {
      return [6, 7];
    }
    return [8, 9];
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
}

export default GameState;
