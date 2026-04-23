/**
 * Manages slot machine game state and core state transitions.
 */
class GameState {
  /**
   * Creates a new game state instance.
   *
   * @param {number} [initialBalance=1000] - Starting balance for the game.
   * @returns {void}
   */
  constructor(initialBalance = 1000) {
    this.balance = initialBalance;
    this.betAmount = 10;
    this.gameHistory = [];
    this.winLog = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;
    this.lastDailyGrantDate = null;
    this.dailyGrantAmount = 250;
    this.targetWinRate = 0.3;
    this.isSpinning = false;
    this.payoutTable = {
      cherry: { multiplier: 10, probability: 0.45 },
      bar: { multiplier: 25, probability: 0.30 },
      bell: { multiplier: 50, probability: 0.17 },
      seven: { multiplier: 100, probability: 0.08 },
      none: { multiplier: 0, probability: 0 },
    };
  }

  /**
   * Performs a spin by validating input, generating reels, and recording history.
   *
   * @param {number} betAmount - Bet amount to use for this spin.
   * @returns {{reels: number[], balance: number, betAmount: number, result: Object}} Spin result details.
   * @throws {Error} If a spin is already in progress.
   * @throws {Error} If the bet amount is not a finite number.
   * @throws {Error} If the bet amount is less than 1.
   * @throws {Error} If the bet amount exceeds available balance.
   */
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

    const reels = this.generateSpinReels();

    this.balance -= betAmount;

    const spinRecord = {
      betAmount,
      reels,
      timestamp: Date.now(),
    };
    this.gameHistory.push(spinRecord);

    const evalResult = this.evaluateSpin(reels, betAmount);
    spinRecord.result = evalResult;

    this.isSpinning = false;

    return {
      reels,
      balance: this.balance,
      betAmount,
      result: evalResult,
    };
  }

  /**
   * Updates the default bet amount for future spins.
   *
   * @param {number} newBetAmount - New default bet amount.
   * @returns {number} The updated bet amount.
   * @throws {Error} If the bet amount is less than 1.
   * @throws {Error} If the bet amount exceeds available balance.
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
   * Gets the current balance.
   *
   * @returns {number} Current balance.
   */
  getBalance() {
    return this.balance;
  }

  /**
   * Gets a copy of the game history.
   *
   * @returns {Array<{betAmount: number, reels: number[], timestamp: number}>} Copy of spin records.
   */
  getGameHistory() {
    return [...this.gameHistory];
  }

  /**
   * Gets winnings-only history entries.
   *
   * @returns {Array<{payout:number, multiplier:number, symbolName:string, timestamp:number}>}
   */
  getWinLog() {
    return [...this.winLog];
  }

  /**
   * Gets the cumulative winnings amount.
   *
   * @returns {number} Lifetime winnings.
   */
  getLifetimeWinnings() {
    return this.lifetimeWinnings;
  }

  /**
   * Gets the largest single win.
   *
   * @returns {{payout:number, multiplier:number, symbolName:string, betAmount:number, timestamp:number}|null}
   */
  getBiggestWin() {
    return this.biggestWin;
  }

  /**
   * Gets the payout table used to define multipliers and probabilities.
   *
   * @returns {Object} The payout table.
   */
  getPayoutTable() {
    return this.payoutTable;
  }

  /**
   * Calculates the theoretical Return to Player (RTP) as a decimal value.
   *
   * @returns {number} RTP as decimal (e.g., 0.94).
   */
  calculateRTP() {
    const averageWinMultiplier =
      (this.payoutTable.cherry.multiplier * this.payoutTable.cherry.probability) +
      (this.payoutTable.bar.multiplier * this.payoutTable.bar.probability) +
      (this.payoutTable.bell.multiplier * this.payoutTable.bell.probability) +
      (this.payoutTable.seven.multiplier * this.payoutTable.seven.probability);

    return this.targetWinRate * averageWinMultiplier;
  }

  /**
   * Maps a reel number (0-9) to its corresponding symbol name.
   *
   * @param {number} reelNumber - Reel position (0-9).
   * @returns {string} Symbol name ("cherry", "bar", "bell", "seven", or "none").
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
   * Looks up the payout multiplier for a given symbol.
   *
   * @param {string} symbolName - Name of the symbol.
   * @returns {number} Payout multiplier (0 if not found).
   */
  getSymbolMultiplier(symbolName) {
    const symbol = this.payoutTable[symbolName];
    if (!symbol) {
      return 0;
    }
    return symbol.multiplier;
  }

  /**
   * Evaluates whether a spin result is a win and computes payout details.
   *
   * @param {number[]} reels - Array of 3 reel positions [0-9, 0-9, 0-9].
   * @param {number} [betAmount=this.betAmount] - Bet used to compute payout for this result.
   * @returns {Object} { isWin: boolean, symbolName: string, multiplier: number, payout: number }.
   */
  evaluateSpin(reels, betAmount = this.betAmount) {
    const symbols = reels.map((reelValue) => this.getSymbolName(reelValue));
    const allSymbolsMatch = symbols[0] === symbols[1] && symbols[1] === symbols[2];
    const symbolName = allSymbolsMatch ? symbols[0] : 'none';
    const multiplier = this.getSymbolMultiplier(symbolName);
    const isWin = allSymbolsMatch && multiplier > 0;
    const payout = isWin ? multiplier * betAmount : 0;

    return {
      isWin,
      symbolName,
      multiplier,
      payout,
    };
  }

  /**
   * Spins once and automatically credits payout to balance for winning results.
   *
   * @param {number} betAmount - Bet amount for this spin.
   * @returns {Object} Spin result with updated balance if win occurred.
   */
  spinWithPayout(betAmount) {
    const spinResult = this.spin(betAmount);

    if (spinResult.result.isWin === true) {
      this.balance += spinResult.result.payout;
      this.lifetimeWinnings += spinResult.result.payout;

      const winRecord = {
        payout: spinResult.result.payout,
        multiplier: spinResult.result.multiplier,
        symbolName: spinResult.result.symbolName,
        timestamp: Date.now(),
      };
      this.winLog.unshift(winRecord);

      if (!this.biggestWin || spinResult.result.payout > this.biggestWin.payout) {
        this.biggestWin = {
          payout: spinResult.result.payout,
          multiplier: spinResult.result.multiplier,
          symbolName: spinResult.result.symbolName,
          betAmount,
          timestamp: Date.now(),
        };
      }
    }

    return {
      reels: spinResult.reels,
      balance: this.balance,
      betAmount: spinResult.betAmount,
      result: spinResult.result,
    };
  }

  /**
   * Returns whether a daily grant can be claimed right now.
   *
   * @returns {boolean}
   */
  canClaimDailyGrant() {
    return this.lastDailyGrantDate !== this.getTodayKey();
  }

  /**
   * Grants daily credits once per local day.
   *
   * @returns {{amount:number,balance:number,lastClaimDate:string}}
   * @throws {Error} If already claimed today.
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
   * Hydrates persisted daily grant claim date.
   *
   * @param {string | null} dateKey
   */
  hydrateDailyGrantDate(dateKey) {
    this.lastDailyGrantDate = typeof dateKey === 'string' ? dateKey : null;
  }

  /**
   * Gets stored daily grant claim date.
   *
   * @returns {string | null}
   */
  getLastDailyGrantDate() {
    return this.lastDailyGrantDate;
  }

  /**
   * Resets the game to its initial state values.
   *
   * @param {number} [newInitialBalance=1000] - New starting balance.
   * @returns {void}
   */
  resetGame(newInitialBalance = 1000) {
    this.balance = newInitialBalance;
    this.betAmount = 10;
    this.gameHistory = [];
    this.winLog = [];
    this.lifetimeWinnings = 0;
    this.biggestWin = null;
    this.lastDailyGrantDate = null;
    this.isSpinning = false;
  }

  generateSpinReels() {
    if (Math.random() < this.targetWinRate) {
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
