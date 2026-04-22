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
    this.isSpinning = false;
    this.payoutTable = {
      cherry: { multiplier: 10, probability: 0.20 },
      bar: { multiplier: 25, probability: 0.10 },
      bell: { multiplier: 50, probability: 0.05 },
      seven: { multiplier: 100, probability: 0.02 },
      none: { multiplier: 0, probability: 0.63 },
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

    const reels = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];

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
    let rtp = 0;
    for (const symbolData of Object.values(this.payoutTable)) {
      rtp += symbolData.multiplier * symbolData.probability;
    }
    return rtp;
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

    // Win when all three symbols match, even if reel numbers differ inside a symbol bucket.
    if (!allSymbolsMatch) {
      return {
        isWin: false,
        symbolName: 'none',
        multiplier: 0,
        payout: 0,
      };
    }

    const symbolName = symbols[0];
    const multiplier = this.getSymbolMultiplier(symbolName);
    const payout = multiplier * betAmount;

    return {
      isWin: true,
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
    }

    return {
      reels: spinResult.reels,
      balance: this.balance,
      betAmount: spinResult.betAmount,
      result: spinResult.result,
    };
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
    this.isSpinning = false;
  }
}

export default GameState;
