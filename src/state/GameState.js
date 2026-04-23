/**
 * Manages slot machine game state and core state transitions.
 */
class GameState {
  constructor(initialBalance = 1000) {
    this.balance = initialBalance;
    this.betAmount = 10;
    this.gameHistory = [];
    this.winLog = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;
    this.lastDailyGrantDate = null;
    this.dailyGrantAmount = 250;

    this.totalSpins = 0;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.recentResults = [];
    this.forceWinNextSpin = false;
    this.forceWinReason = null;

    this.progressiveJackpotPool = 500;
    this.jackpotSeedAmount = 500;
    this.jackpotContributionRate = 0.02;

    // Tune baseline economy lower so combo/pity/milestones land near ~92% effective RTP.
    this.targetWinRate = 0.30;
    this.isSpinning = false;
    this.payoutTable = {
      cherry: { multiplier: 1.4, probability: 0.45 },
      bar: { multiplier: 2.3, probability: 0.3 },
      bell: { multiplier: 4.3, probability: 0.17 },
      seven: { multiplier: 9.5, probability: 0.08 },
      none: { multiplier: 0, probability: 0 },
    };
  }

  spin(betAmount) {
    if (this.isSpinning === true) {
      throw new Error('Spin already in progress');
    }
    if (!Number.isFinite(betAmount)) {
      throw new Error('Bet amount must be a valid number');
    }
    if (betAmount < 1) {
      throw new Error('Bet amount must be at least 1');
    }
    if (betAmount > this.balance) {
      throw new Error('Insufficient balance for bet');
    }

    this.isSpinning = true;

    const wasForcedWin = this.forceWinNextSpin;
    const reels = this.generateSpinReels({ forceWin: wasForcedWin });

    if (wasForcedWin) {
      this.forceWinNextSpin = false;
      this.forceWinReason = null;
    }

    this.balance -= betAmount;

    const spinRecord = {
      betAmount,
      reels,
      timestamp: Date.now(),
      wasForcedWin,
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
      result: evalResult,
    };
  }

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

  getBalance() {
    return this.balance;
  }

  getGameHistory() {
    return [...this.gameHistory];
  }

  getWinLog() {
    return [...this.winLog];
  }

  getLifetimeWinnings() {
    return this.lifetimeWinnings;
  }

  getBiggestWin() {
    return this.biggestWin;
  }

  getPayoutTable() {
    return this.payoutTable;
  }

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

  getSymbolMultiplier(symbolName) {
    const symbol = this.payoutTable[symbolName];
    if (!symbol) {
      return 0;
    }
    return symbol.multiplier;
  }

  evaluateSpin(reels, betAmount = this.betAmount) {
    const symbols = reels.map((reelValue) => this.getSymbolName(reelValue));
    const allSymbolsMatch = symbols[0] === symbols[1] && symbols[1] === symbols[2];
    const symbolName = allSymbolsMatch ? symbols[0] : 'none';
    const multiplier = this.getSymbolMultiplier(symbolName);
    const isWin = allSymbolsMatch && multiplier > 0;
    const payout = isWin ? Math.round(multiplier * betAmount) : 0;

    return {
      isWin,
      symbolName,
      multiplier,
      payout,
    };
  }

  spinWithPayout(betAmount) {
    const jackpotContribution = Number((betAmount * this.jackpotContributionRate).toFixed(2));
    this.progressiveJackpotPool += jackpotContribution;

    const spinResult = this.spin(betAmount);
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
    };

    if (spinResult.result.isWin === true) {
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
        timestamp: Date.now(),
      });

      if (!this.biggestWin || result.totalPayout > this.biggestWin.payout) {
        this.biggestWin = {
          payout: result.totalPayout,
          multiplier: spinResult.result.multiplier,
          symbolName: spinResult.result.symbolName,
          betAmount,
          timestamp: Date.now(),
        };
      }

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
    };
  }

  canClaimDailyGrant() {
    return this.lastDailyGrantDate !== this.getTodayKey();
  }

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

  hydrateDailyGrantDate(dateKey) {
    this.lastDailyGrantDate = typeof dateKey === 'string' ? dateKey : null;
  }

  getLastDailyGrantDate() {
    return this.lastDailyGrantDate;
  }

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

  pushRecentResult(isWin) {
    this.recentResults.push(isWin);
    if (this.recentResults.length > 10) {
      this.recentResults.shift();
    }
  }

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
    };
  }

  getPersistenceState() {
    return {
      balance: this.balance,
      betAmount: this.betAmount,
      gameHistory: this.gameHistory.slice(-150),
      winLog: this.winLog.slice(0, 40),
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
    };
  }

  hydrateFromState(state) {
    if (!state || typeof state !== 'object') {
      return;
    }

    this.balance = Number.isFinite(state.balance) ? state.balance : this.balance;
    this.betAmount = Number.isFinite(state.betAmount) ? state.betAmount : this.betAmount;
    this.gameHistory = Array.isArray(state.gameHistory) ? [...state.gameHistory] : [];
    this.winLog = Array.isArray(state.winLog) ? [...state.winLog] : [];
    this.lifetimeWinnings = Number.isFinite(state.lifetimeWinnings) ? state.lifetimeWinnings : 0;
    this.biggestWin = state.biggestWin ?? null;
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
  }

  resetGame(newInitialBalance = 1000) {
    this.balance = newInitialBalance;
    this.betAmount = 10;
    this.gameHistory = [];
    this.winLog = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;
    this.lastDailyGrantDate = null;
    this.totalSpins = 0;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.recentResults = [];
    this.forceWinNextSpin = false;
    this.forceWinReason = null;
    this.progressiveJackpotPool = this.jackpotSeedAmount;
    this.isSpinning = false;
  }

  generateSpinReels({ forceWin = false } = {}) {
    if (forceWin || Math.random() < this.targetWinRate) {
      return this.generateWinningReels();
    }
    return this.generateLosingReels();
  }

  generateWinningReels() {
    const winningSymbol = this.pickWinningSymbol();
    const reelValues = this.getReelValuesForSymbol(winningSymbol);
    const pickValue = () => reelValues[Math.floor(Math.random() * reelValues.length)];

    return [pickValue(), pickValue(), pickValue()];
  }

  generateLosingReels() {
    let reels = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];

    while (this.evaluateSpin(reels, this.betAmount).isWin) {
      reels = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ];
    }

    return reels;
  }

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

  getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default GameState;
