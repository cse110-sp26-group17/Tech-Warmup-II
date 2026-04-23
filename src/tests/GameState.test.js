import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../state/GameState';

describe('GameState', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wins on 3 matching symbols from the left', () => {
    const gameState = new GameState(500);
    const result = gameState.evaluateSpin([0, 1, 0, 4, 8], 10);

    expect(result).toEqual({
      isWin: true,
      symbolName: 'cherry',
      multiplier: 1.4,
      payout: 14,
      matchCount: 3,
    });
  });

  it('applies tier multipliers for 4 and 5 left-to-right matches', () => {
    const gameState = new GameState(500);

    const fourMatch = gameState.evaluateSpin([2, 3, 2, 3, 8], 10);
    const fiveMatch = gameState.evaluateSpin([4, 5, 4, 5, 4], 10);

    expect(fourMatch.matchCount).toBe(4);
    expect(fourMatch.multiplier).toBe(4.14);
    expect(fourMatch.payout).toBe(41);

    expect(fiveMatch.matchCount).toBe(5);
    expect(fiveMatch.multiplier).toBe(12.9);
    expect(fiveMatch.payout).toBe(129);
  });

  it('applies combo multipliers across consecutive wins', () => {
    const gameState = new GameState(1000);
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 0, 1, 4, 8]);

    const first = gameState.spinWithPayout(10);
    const second = gameState.spinWithPayout(10);
    const third = gameState.spinWithPayout(10);

    expect(first.result.comboMultiplier).toBe(1);
    expect(first.result.totalPayout).toBe(14);
    expect(second.result.comboMultiplier).toBe(1.2);
    expect(second.result.totalPayout).toBe(17);
    expect(third.result.comboMultiplier).toBe(1.5);
    expect(third.result.totalPayout).toBe(21);
    expect(gameState.currentWinStreak).toBe(3);
    expect(gameState.currentLossStreak).toBe(0);
  });

  it('deducts only the bet on a non-winning spin and tracks loss streak', () => {
    const gameState = new GameState(100);
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 2, 4, 6, 8]);

    const result = gameState.spinWithPayout(25);

    expect(result.result.isWin).toBe(false);
    expect(result.result.payout).toBe(0);
    expect(result.balance).toBe(75);
    expect(gameState.getBalance()).toBe(75);
    expect(gameState.getLifetimeWinnings()).toBe(0);
    expect(gameState.currentLossStreak).toBe(1);
  });

  it('throws on invalid and unaffordable bets', () => {
    const gameState = new GameState(25);

    expect(() => gameState.spinWithPayout(0)).toThrow('Bet amount must be at least 1');
    expect(() => gameState.spinWithPayout(50)).toThrow('Insufficient balance for bet');
  });

  it('throws if spin is called while a spin is already in progress', () => {
    const gameState = new GameState(100);
    gameState.isSpinning = true;

    expect(() => gameState.spin(10)).toThrow('Spin already in progress');
  });

  it('records spin result in game history', () => {
    const gameState = new GameState(100);
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 0, 1, 8, 9]);

    gameState.spinWithPayout(10);
    const history = gameState.getGameHistory();

    expect(history).toHaveLength(1);
    expect(history[0].betAmount).toBe(10);
    expect(history[0].reels).toEqual([0, 0, 1, 8, 9]);
    expect(history[0].result.isWin).toBe(true);
    expect(history[0].result.symbolName).toBe('cherry');
    expect(history[0].result.matchCount).toBe(3);
  });

  it('supports daily grant only once per day', () => {
    const gameState = new GameState(100);
    vi.spyOn(gameState, 'getTodayKey').mockReturnValue('2026-04-22');

    expect(gameState.canClaimDailyGrant()).toBe(true);
    const grant = gameState.claimDailyGrant();

    expect(grant.amount).toBe(250);
    expect(gameState.getBalance()).toBe(350);
    expect(gameState.canClaimDailyGrant()).toBe(false);
    expect(() => gameState.claimDailyGrant()).toThrow('Daily VC already claimed today');
  });

  it('awards progressive jackpot on triple seven and resets pool', () => {
    const gameState = new GameState(1000);
    gameState.progressiveJackpotPool = 650.4;
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([6, 7, 6, 2, 4]);

    const result = gameState.spinWithPayout(10);

    expect(result.result.isWin).toBe(true);
    expect(result.result.symbolName).toBe('seven');
    expect(result.result.jackpotBonus).toBe(650);
    expect(result.result.totalPayout).toBe(745);
    expect(gameState.progressiveJackpotPool).toBe(500);
  });

  it('forces next spin to win after 8 losses (pity system)', () => {
    const gameState = new GameState(1000);
    gameState.targetWinRate = 0;
    vi.spyOn(gameState, 'generateLosingReels').mockReturnValue([0, 2, 4, 6, 8]);
    vi.spyOn(gameState, 'generateWinningReels').mockReturnValue([0, 0, 1, 7, 8]);

    for (let index = 0; index < 8; index += 1) {
      gameState.spinWithPayout(10);
    }

    expect(gameState.forceWinNextSpin).toBe(true);
    const forcedResult = gameState.spinWithPayout(10);
    expect(forcedResult.result.isWin).toBe(true);
    expect(forcedResult.result.wasForcedWin).toBe(true);
    expect(gameState.currentLossStreak).toBe(0);
  });

  it('awards spin milestone bonuses and enables major milestone guarantee', () => {
    const gameState = new GameState(1000);
    gameState.targetWinRate = 0;
    vi.spyOn(gameState, 'generateLosingReels').mockReturnValue([0, 2, 4, 6, 8]);

    for (let index = 0; index < 9; index += 1) {
      gameState.spinWithPayout(10);
    }

    const tenth = gameState.spinWithPayout(10);
    expect(tenth.result.milestoneBonus).toBe(50);
    expect(tenth.result.milestoneType).toBe('minor');

    for (let index = 0; index < 39; index += 1) {
      gameState.spinWithPayout(10);
    }

    const fiftieth = gameState.spinWithPayout(10);
    expect(fiftieth.result.milestoneBonus).toBe(500);
    expect(fiftieth.result.milestoneType).toBe('major');
    expect(gameState.forceWinNextSpin).toBe(true);
  });

  it('persists and restores key gameplay state', () => {
    const gameState = new GameState(1000);
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 0, 1, 5, 9]);
    gameState.spinWithPayout(10);
    gameState.spinWithPayout(10);

    const saved = gameState.getPersistenceState();
    const restored = new GameState(1000);
    restored.hydrateFromState(saved);

    expect(restored.getBalance()).toBe(gameState.getBalance());
    expect(restored.getLifetimeWinnings()).toBe(gameState.getLifetimeWinnings());
    expect(restored.currentWinStreak).toBe(gameState.currentWinStreak);
    expect(restored.progressiveJackpotPool).toBe(gameState.progressiveJackpotPool);
    expect(restored.getWinLog()).toHaveLength(gameState.getWinLog().length);
  });

  it('resets balance, bet, history, streaks, jackpot, and spin lock on resetGame', () => {
    const gameState = new GameState(100);
    gameState.betAmount = 25;
    gameState.gameHistory.push({ betAmount: 10, reels: [1, 2, 3, 4, 5], timestamp: Date.now() });
    gameState.winLog.push({ payout: 200, multiplier: 10, symbolName: 'cherry', timestamp: Date.now() });
    gameState.lifetimeWinnings = 200;
    gameState.biggestWin = { payout: 200, multiplier: 10, symbolName: 'cherry', betAmount: 20, timestamp: Date.now() };
    gameState.lastDailyGrantDate = '2026-04-22';
    gameState.currentWinStreak = 3;
    gameState.currentLossStreak = 2;
    gameState.forceWinNextSpin = true;
    gameState.progressiveJackpotPool = 900;
    gameState.freeRollsAvailable = 2;
    gameState.isSpinning = true;

    gameState.resetGame(300);

    expect(gameState.getBalance()).toBe(300);
    expect(gameState.betAmount).toBe(10);
    expect(gameState.getGameHistory()).toEqual([]);
    expect(gameState.getWinLog()).toEqual([]);
    expect(gameState.getLifetimeWinnings()).toBe(0);
    expect(gameState.getBiggestWin()).toBeNull();
    expect(gameState.getLastDailyGrantDate()).toBeNull();
    expect(gameState.currentWinStreak).toBe(0);
    expect(gameState.currentLossStreak).toBe(0);
    expect(gameState.forceWinNextSpin).toBe(false);
    expect(gameState.progressiveJackpotPool).toBe(gameState.jackpotSeedAmount);
    expect(gameState.getFreeRollCount()).toBe(0);
    expect(gameState.isSpinning).toBe(false);
  });

  it('returns 0 multiplier for unknown symbols', () => {
    const gameState = new GameState(100);
    expect(gameState.getSymbolMultiplier('unknown')).toBe(0);
  });

  it('consumes a free roll and skips bet deduction', () => {
    const gameState = new GameState(100);
    gameState.awardFreeRoll('test');
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 2, 4, 6, 8]);

    const outcome = gameState.spinWithPayout(25);

    expect(outcome.result.usedFreeRoll).toBe(true);
    expect(gameState.getBalance()).toBe(100);
    expect(gameState.getFreeRollCount()).toBe(0);
  });

  it('awards consolation free roll when pity system kicks in', () => {
    const gameState = new GameState(1000);
    gameState.targetWinRate = 0;
    vi.spyOn(gameState, 'generateLosingReels').mockReturnValue([0, 2, 4, 6, 8]);

    let lastOutcome = null;
    for (let index = 0; index < 8; index += 1) {
      lastOutcome = gameState.spinWithPayout(10);
    }

    expect(lastOutcome.freeRollAwarded).toBe('consolation');
    expect(gameState.getFreeRollCount()).toBeGreaterThanOrEqual(1);
  });

  it('awards milestone free roll every 20 spins', () => {
    const gameState = new GameState(2000);
    vi.spyOn(gameState, 'generateSpinReels').mockReturnValue([0, 0, 1, 8, 9]);

    let lastOutcome = null;
    for (let index = 0; index < 20; index += 1) {
      lastOutcome = gameState.spinWithPayout(10);
    }

    expect(lastOutcome.freeRollAwarded).toBe('milestone');
    expect(gameState.getFreeRollCount()).toBeGreaterThanOrEqual(1);
  });

  it('persists and restores free roll state', () => {
    const gameState = new GameState(1000);
    gameState.awardFreeRoll('milestone');
    gameState.awardFreeRoll('random');

    const saved = gameState.getPersistenceState();
    const restored = new GameState(1000);
    restored.hydrateFromState(saved);

    expect(restored.getFreeRollCount()).toBe(2);
    expect(restored.freeRollReason).toBe('random');
  });
});
