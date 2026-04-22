const defaultHooks = {
  playSpinSound: () => {},
  playStopSound: () => {},
  playWinSound: () => {},
};

const registeredHooks = { ...defaultHooks };

function callExternalHook(name, args) {
  if (
    typeof window !== 'undefined' &&
    window.slotSoundHooks &&
    typeof window.slotSoundHooks[name] === 'function'
  ) {
    window.slotSoundHooks[name](...args);
    return true;
  }
  return false;
}

export function registerSoundHooks(hooks) {
  if (!hooks || typeof hooks !== 'object') {
    return;
  }
  if (typeof hooks.playSpinSound === 'function') {
    registeredHooks.playSpinSound = hooks.playSpinSound;
  }
  if (typeof hooks.playStopSound === 'function') {
    registeredHooks.playStopSound = hooks.playStopSound;
  }
  if (typeof hooks.playWinSound === 'function') {
    registeredHooks.playWinSound = hooks.playWinSound;
  }
}

export function playSpinSound() {
  if (callExternalHook('playSpinSound', [])) {
    return;
  }
  registeredHooks.playSpinSound();
}

export function playStopSound() {
  if (callExternalHook('playStopSound', [])) {
    return;
  }
  registeredHooks.playStopSound();
}

export function playWinSound(tier) {
  if (callExternalHook('playWinSound', [tier])) {
    return;
  }
  registeredHooks.playWinSound(tier);
}
