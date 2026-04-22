# Slot Machine Frontend

## Added React UI

- `main.jsx`: app entry.
- `SlotMachine.jsx`: top-level screen layout.
- `controller/useSlotMachineController.js`: state machine + GameState integration.
- `components/*`: UI modules (`HUD`, `Reel`, `ReelSet`, `SpinButton`, `BetControls`, `WinOverlay`, `SettingsOverlay`).
- `animations/reelAnimation.js`: reel/win timing helpers, win-tier classification, near-miss visuals.
- `audio/soundHooks.js`: sound hook shims (`playSpinSound`, `playStopSound`, `playWinSound`).
- `styles.css`: mobile-first casino theme + animations + accessibility-focused sizing.

## Integration Points

- Spins call: `gameState.spinWithPayout(betAmount)`.
- Sound hooks can be wired through:
  - `window.slotSoundHooks.playSpinSound()`
  - `window.slotSoundHooks.playStopSound()`
  - `window.slotSoundHooks.playWinSound(tier)`
