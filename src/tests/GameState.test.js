import { describe, expect, it, vi } from 'vitest';
import GameState from '../state/GameState';

describe('GameState', () => {
  it('wins when all three symbols match even if reel numbers differ', () => {
    const gameState = new GameState(500);
    const randomSpy = vi
      .spyOn(Math, 'random')
      // 0,1,0 => cherry,cherry,cherry (same symbol bucket)
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0.19)
      .mockReturnValueOnce(0.02);

    const result = gameState.spinWithPayout(10);

    expect(result.reels).toEqual([0, 1, 0]);
    expect(result.result.isWin).toBe(true);
    expect(result.result.symbolName).toBe('cherry');
    expect(result.result.multiplier).toBe(10);
    expect(result.result.payout).toBe(100);
    // 500 - 10 + 100
    expect(result.balance).toBe(590);

    randomSpy.mockRestore();
  });

  it('credits payout after a winning spinWithPayout call', () => {
    const gameState = new GameState(1000);
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const result = gameState.spinWithPayout(20);

    expect(result.result.isWin).toBe(true);
    expect(result.result.symbolName).toBe('cherry');
    expect(result.result.payout).toBe(200);
    expect(result.balance).toBe(1180);
    expect(gameState.getBalance()).toBe(1180);

    randomSpy.mockRestore();
  });

  it('deducts only the bet on a non-winning spin', () => {
    const gameState = new GameState(100);
    const randomSpy = vi
      .spyOn(Math, 'random')
      // 0,2,4 => cherry,bar,bell
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4);

    const result = gameState.spinWithPayout(25);

    expect(result.result.isWin).toBe(false);
    expect(result.result.payout).toBe(0);
    expect(result.balance).toBe(75);
    expect(gameState.getBalance()).toBe(75);

    randomSpy.mockRestore();
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

  it('resets balance, bet, history, and spin lock on resetGame', () => {
    const gameState = new GameState(100);
    gameState.betAmount = 25;
    gameState.gameHistory.push({ betAmount: 10, reels: [1, 2, 3], timestamp: Date.now() });
    gameState.isSpinning = true;

    gameState.resetGame(300);

    expect(gameState.getBalance()).toBe(300);
    expect(gameState.betAmount).toBe(10);
    expect(gameState.getGameHistory()).toEqual([]);
    expect(gameState.isSpinning).toBe(false);
  });

  it('returns 0 multiplier for unknown symbols', () => {
    const gameState = new GameState(100);
    expect(gameState.getSymbolMultiplier('unknown')).toBe(0);
  });
});
