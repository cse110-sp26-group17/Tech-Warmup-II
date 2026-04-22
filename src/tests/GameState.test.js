import { describe, expect, it, vi } from 'vitest';
import GameState from '../state/GameState';

describe('GameState', () => {
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

  it('throws on invalid and unaffordable bets', () => {
    const gameState = new GameState(25);

    expect(() => gameState.spinWithPayout(0)).toThrow('Bet amount must be at least 1');
    expect(() => gameState.spinWithPayout(50)).toThrow('Insufficient balance for bet');
  });
});
