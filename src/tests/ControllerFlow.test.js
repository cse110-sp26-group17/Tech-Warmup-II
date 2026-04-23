import { describe, expect, it } from 'vitest';
import {
  MACHINE_EVENTS,
  MACHINE_STATES,
  transitionMachineState,
} from '../animations/reelAnimation';
import {
  canStartSpin,
  getPostResultStatusMessage,
  getSpinPrecheckError,
  getSpinStartStatusMessage,
} from '../controller/useSlotMachineController';

describe('Controller flow helpers', () => {
  it('allows a spin only when idle and unlocked', () => {
    expect(
      canStartSpin({
        machineState: MACHINE_STATES.IDLE,
        controlsLocked: false,
        spinLocked: false,
      })
    ).toBe(true);

    expect(
      canStartSpin({
        machineState: MACHINE_STATES.SPINNING,
        controlsLocked: false,
        spinLocked: false,
      })
    ).toBe(false);

    expect(
      canStartSpin({
        machineState: MACHINE_STATES.IDLE,
        controlsLocked: true,
        spinLocked: false,
      })
    ).toBe(false);

    expect(
      canStartSpin({
        machineState: MACHINE_STATES.IDLE,
        controlsLocked: false,
        spinLocked: true,
      })
    ).toBe(false);
  });

  it('validates spin prechecks for low balance and free-roll override', () => {
    expect(
      getSpinPrecheckError({
        balance: 0,
        betAmount: 10,
        freeRolls: 0,
      })
    ).toBe('Balance too low for that bet');

    expect(
      getSpinPrecheckError({
        balance: 5,
        betAmount: 10,
        freeRolls: 0,
      })
    ).toBe('Balance too low for that bet');

    expect(
      getSpinPrecheckError({
        balance: 0,
        betAmount: 10,
        freeRolls: 1,
      })
    ).toBeNull();
  });

  it('returns deterministic status messages for spin start and spin result', () => {
    expect(getSpinStartStatusMessage({ lossStreak: 0, turboMode: false })).toBe('Spinning reels...');
    expect(getSpinStartStatusMessage({ lossStreak: 2, turboMode: true })).toBe(
      'Turbo spin in progress...'
    );
    expect(getSpinStartStatusMessage({ lossStreak: 5, turboMode: false })).toBe('Luck is building...');

    expect(
      getPostResultStatusMessage({
        usedFreeRoll: true,
        shouldShowDueForWin: false,
        isWin: false,
      })
    ).toBe('FREE ROLL USED');

    expect(
      getPostResultStatusMessage({
        usedFreeRoll: false,
        shouldShowDueForWin: true,
        isWin: false,
      })
    ).toBe('DUE FOR A WIN');

    expect(
      getPostResultStatusMessage({
        usedFreeRoll: false,
        shouldShowDueForWin: false,
        isWin: true,
      })
    ).toBe('Ready for your next spin');
  });
});

describe('Machine state transitions', () => {
  it('keeps UI state consistent under rapid spin-start events', () => {
    let state = MACHINE_STATES.IDLE;

    state = transitionMachineState(state, MACHINE_EVENTS.START_SPIN);
    state = transitionMachineState(state, MACHINE_EVENTS.START_SPIN);
    state = transitionMachineState(state, MACHINE_EVENTS.START_SPIN);

    expect(state).toBe(MACHINE_STATES.SPINNING);

    state = transitionMachineState(state, MACHINE_EVENTS.SHOW_RESULT);
    expect(state).toBe(MACHINE_STATES.RESULT);

    state = transitionMachineState(state, MACHINE_EVENTS.START_PAYOUT);
    expect(state).toBe(MACHINE_STATES.PAYOUT);

    state = transitionMachineState(state, MACHINE_EVENTS.END_SPIN);
    expect(state).toBe(MACHINE_STATES.IDLE);
  });

  it('ignores invalid transition ordering', () => {
    let state = MACHINE_STATES.IDLE;

    state = transitionMachineState(state, MACHINE_EVENTS.START_PAYOUT);
    expect(state).toBe(MACHINE_STATES.IDLE);

    state = transitionMachineState(state, MACHINE_EVENTS.SHOW_RESULT);
    expect(state).toBe(MACHINE_STATES.IDLE);
  });
});
