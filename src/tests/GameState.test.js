import { describe, expect, it, vi } from 'vitest';
import GameState from '../state/GameState';

describe('GameState', () => {
  it('wins when all three symbols match even if reel numbers differ', () => {
    const gameState = new GameState(500);
    const randomSpy = vi
      .spyOn(Math, 'random')
      // targetWinRate check -> win path
      .mockReturnValueOnce(0.1)
      // pickWinningSymbol -> cherry
      .mockReturnValueOnce(0.1)
      // pick values from [0,1] -> 0,1,0
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.1);

    const result = gameState.spinWithPayout(10);

    expect(result.reels).toEqual([0, 1, 0]);
    expect(result.result.isWin).toBe(true);
    expect(result.result.symbolName).toBe('cherry');
    expect(result.result.multiplier).toBe(10);
    expect(result.result.payout).toBe(100);
    expect(result.balance).toBe(590);

    randomSpy.mockRestore();
  });

  it('credits payout and lifetime winnings after a winning spinWithPayout call', () => {
    const gameState = new GameState(1000);
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    const result = gameState.spinWithPayout(20);

    expect(result.result.isWin).toBe(true);
    expect(result.result.symbolName).toBe('cherry');
    expect(result.result.payout).toBe(200);
    expect(result.balance).toBe(1180);
    expect(gameState.getBalance()).toBe(1180);
    expect(gameState.getLifetimeWinnings()).toBe(200);
    expect(gameState.getWinLog()).toHaveLength(1);

    randomSpy.mockRestore();
  });

  it('deducts only the bet on a non-winning spin', () => {
    const gameState = new GameState(100);
    const randomSpy = vi
      .spyOn(Math, 'random')
      // targetWinRate check -> force losing path
      .mockReturnValueOnce(0.99)
      // reels 0,2,4 => cherry,bar,bell
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4);

    const result = gameState.spinWithPayout(25);

    expect(result.result.isWin).toBe(false);
    expect(result.result.payout).toBe(0);
    expect(result.balance).toBe(75);
    expect(gameState.getBalance()).toBe(75);
    expect(gameState.getLifetimeWinnings()).toBe(0);

    randomSpy.mockRestore();
  });

  it('does not treat triple none as a win', () => {
    const gameState = new GameState(100);
    const result = gameState.evaluateSpin([8, 9, 8], 10);

    expect(result).toEqual({
      isWin: false,
      symbolName: 'none',
      multiplier: 0,
      payout: 0,
    });
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
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    gameState.spinWithPayout(10);
    const history = gameState.getGameHistory();

    expect(history).toHaveLength(1);
    expect(history[0].betAmount).toBe(10);
    expect(history[0].reels).toEqual([0, 0, 0]);
    expect(history[0].result).toEqual({
      isWin: true,
      symbolName: 'cherry',
      multiplier: 10,
      payout: 100,
    });

    randomSpy.mockRestore();
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

  it('resets balance, bet, history, win aggregates, and spin lock on resetGame', () => {
    const gameState = new GameState(100);
    gameState.betAmount = 25;
    gameState.gameHistory.push({ betAmount: 10, reels: [1, 2, 3], timestamp: Date.now() });
    gameState.winLog.push({ payout: 200, multiplier: 10, symbolName: 'cherry', timestamp: Date.now() });
    gameState.lifetimeWinnings = 200;
    gameState.biggestWin = { payout: 200, multiplier: 10, symbolName: 'cherry', betAmount: 20, timestamp: Date.now() };
    gameState.lastDailyGrantDate = '2026-04-22';
    gameState.isSpinning = true;

    gameState.resetGame(300);

    expect(gameState.getBalance()).toBe(300);
    expect(gameState.betAmount).toBe(10);
    expect(gameState.getGameHistory()).toEqual([]);
    expect(gameState.getWinLog()).toEqual([]);
    expect(gameState.getLifetimeWinnings()).toBe(0);
    expect(gameState.getBiggestWin()).toBeNull();
    expect(gameState.getLastDailyGrantDate()).toBeNull();
    expect(gameState.isSpinning).toBe(false);
  });

  it('returns 0 multiplier for unknown symbols', () => {
    const gameState = new GameState(100);
    expect(gameState.getSymbolMultiplier('unknown')).toBe(0);
  });
});
