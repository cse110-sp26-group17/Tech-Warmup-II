const defaultHooks = {
  playSpinSound: () => {},
  playStopSound: () => {},
  playWinSound: () => {},
  playLossSound: () => {},
  playMilestoneSound: () => {},
  playBalanceCountSound: () => {},
};

const registeredHooks = { ...defaultHooks };

const activeMedia = {
  spin: null,
  stop: null,
  win: null,
  loss: null,
  milestone: null,
  count: null,
};

const activeSynth = {
  spin: { timers: [], nodes: [] },
  stop: { timers: [], nodes: [] },
  win: { timers: [], nodes: [] },
  loss: { timers: [], nodes: [] },
  milestone: { timers: [], nodes: [] },
  count: { timers: [], nodes: [] },
};

let cachedAudioContext = null;

/**
 * Pauses and resets the media element on the given channel, if one is active.
 * @param {string} channel - Audio channel key (e.g. 'spin', 'win').
 */
function stopMedia(channel) {
  const media = activeMedia[channel];
  if (!media || typeof media.pause !== 'function') {
    return;
  }
  media.pause();
  if ('currentTime' in media) {
    media.currentTime = 0;
  }
  activeMedia[channel] = null;
}

/**
 * Cancels all pending synth timers and stops all oscillator nodes on the given channel.
 * @param {string} channel - Audio channel key.
 */
function stopSynthChannel(channel) {
  activeSynth[channel].timers.forEach((timerId) => clearTimeout(timerId));
  activeSynth[channel].timers = [];

  activeSynth[channel].nodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // Node may already be stopped; ignore.
    }
    node.disconnect();
  });
  activeSynth[channel].nodes = [];
}

/**
 * Stops both the media element and all synth activity on the given channel.
 * @param {string} channel - Audio channel key.
 */
function stopChannel(channel) {
  stopMedia(channel);
  stopSynthChannel(channel);
}

/**
 * Returns the shared AudioContext, creating it on first call. Returns null in non-browser environments.
 * @returns {AudioContext | null}
 */
function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }
  const ContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!ContextCtor) {
    return null;
  }
  if (!cachedAudioContext) {
    cachedAudioContext = new ContextCtor();
  }
  if (cachedAudioContext.state === 'suspended') {
    cachedAudioContext.resume().catch(() => {});
  }
  return cachedAudioContext;
}

/**
 * Schedules a single synthesised tone on the given channel via the Web Audio API.
 * @param {string} channel - Audio channel key.
 * @param {{atMs: number, durationMs: number, frequency: number, volume?: number, type?: OscillatorType}} options
 */
function scheduleTone(channel, { atMs, durationMs, frequency, volume = 0.05, type = 'sine' }) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const timerId = setTimeout(() => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000);

    activeSynth[channel].nodes.push(oscillator);
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
      } catch {
        // Ignore disconnect races.
      }
      try {
        gainNode.disconnect();
      } catch {
        // Ignore disconnect races.
      }
      activeSynth[channel].nodes = activeSynth[channel].nodes.filter((node) => node !== oscillator);
    };
  }, atMs);

  activeSynth[channel].timers.push(timerId);
}

/**
 * Plays the built-in synthesised spin sound on the 'spin' channel.
 */
function playFallbackSpin() {
  stopChannel('spin');
  stopChannel('win');

  scheduleTone('spin', { atMs: 0, durationMs: 120, frequency: 215, volume: 0.05, type: 'sawtooth' });
  scheduleTone('spin', { atMs: 120, durationMs: 120, frequency: 180, volume: 0.04, type: 'triangle' });
  scheduleTone('spin', { atMs: 240, durationMs: 90, frequency: 150, volume: 0.03, type: 'triangle' });
}

/**
 * Plays the built-in synthesised reel-stop click on the 'stop' channel.
 */
function playFallbackStop() {
  stopChannel('stop');
  scheduleTone('stop', { atMs: 0, durationMs: 45, frequency: 700, volume: 0.03, type: 'square' });
}

/**
 * Plays the built-in synthesised win jingle scaled to the given tier.
 * @param {'jackpot' | 'big' | 'medium' | 'small' | 'loss'} tier - Win tier key.
 */
function playFallbackWin(tier) {
  stopChannel('spin');
  stopChannel('win');

  const winFrequencies = {
    jackpot: [523, 659, 784, 1046, 1318],
    big: [392, 523, 659, 880],
    medium: [349, 440, 554],
    small: [330, 415],
    loss: [262],
  };

  const steps = winFrequencies[tier] || winFrequencies.small;
  steps.forEach((frequency, index) => {
    scheduleTone('win', {
      atMs: index * 105,
      durationMs: 120,
      frequency,
      volume: 0.06,
      type: 'triangle',
    });
  });
}

/**
 * Plays the built-in synthesised loss sound on the 'loss' channel.
 */
function playFallbackLoss() {
  stopChannel('loss');
  scheduleTone('loss', { atMs: 0, durationMs: 120, frequency: 190, volume: 0.06, type: 'sawtooth' });
  scheduleTone('loss', { atMs: 90, durationMs: 140, frequency: 135, volume: 0.05, type: 'triangle' });
}

/**
 * Plays the built-in synthesised milestone chime on the 'milestone' channel.
 */
function playFallbackMilestone() {
  stopChannel('milestone');
  [523, 659, 784].forEach((frequency, index) => {
    scheduleTone('milestone', {
      atMs: index * 80,
      durationMs: 140,
      frequency,
      volume: 0.065,
      type: 'triangle',
    });
  });
}

/**
 * Plays a synthesised balance-counting sound scaled to the given duration.
 * @param {number} durationMs - Approximate duration of the balance counter animation in ms.
 */
function playFallbackBalanceCount(durationMs) {
  stopChannel('count');

  const safeDuration = Number.isFinite(durationMs) ? durationMs : 900;
  const burstCount = Math.max(6, Math.min(16, Math.floor(safeDuration / 80)));

  for (let index = 0; index < burstCount; index += 1) {
    scheduleTone('count', {
      atMs: index * 70,
      durationMs: 40,
      frequency: 380 + index * 24,
      volume: 0.032,
      type: 'square',
    });
  }

  const finishAt = burstCount * 70;
  scheduleTone('count', {
    atMs: finishAt,
    durationMs: 110,
    frequency: 1046,
    volume: 0.06,
    type: 'triangle',
  });
  scheduleTone('count', {
    atMs: finishAt + 90,
    durationMs: 140,
    frequency: 1318,
    volume: 0.045,
    type: 'sine',
  });
}

/**
 * Attempts to call a sound hook from the global `window.slotSoundHooks` object.
 * @param {string} name - Hook method name.
 * @param {*[]} args - Arguments to pass to the hook.
 * @returns {{called: boolean, result: *}}
 */
function callExternalHook(name, args) {
  if (
    typeof window !== 'undefined' &&
    window.slotSoundHooks &&
    typeof window.slotSoundHooks[name] === 'function'
  ) {
    return {
      called: true,
      result: window.slotSoundHooks[name](...args),
    };
  }
  return { called: false, result: null };
}

/**
 * Attempts to call a sound hook registered via `registerSoundHooks`, skipping the default no-op.
 * @param {string} name - Hook method name.
 * @param {*[]} args - Arguments to pass to the hook.
 * @returns {{called: boolean, result: *}}
 */
function callRegisteredHook(name, args) {
  if (registeredHooks[name] === defaultHooks[name]) {
    return {
      called: false,
      result: null,
    };
  }
  return {
    called: true,
    result: registeredHooks[name](...args),
  };
}

/**
 * Returns true if the value is a playable media element (has `.pause` and `.play` methods).
 * @param {*} value
 * @returns {boolean}
 */
function isPlayableMedia(value) {
  return value && typeof value.pause === 'function' && typeof value.play === 'function';
}

/**
 * Stops the channel, then dispatches to the external hook, registered hook, or fallback in that order.
 * If a hook returns a playable media element, it is played immediately.
 * @param {string} channel - Audio channel key.
 * @param {string} name - Hook method name.
 * @param {*[]} args - Arguments forwarded to the hook.
 * @param {() => void} fallback - Synthesised fallback called when no hook is registered.
 */
function runHook(channel, name, args, fallback) {
  stopChannel(channel);

  const externalResult = callExternalHook(name, args);
  if (externalResult.called) {
    if (isPlayableMedia(externalResult.result)) {
      activeMedia[channel] = externalResult.result;
      externalResult.result.currentTime = 0;
      externalResult.result.play().catch(() => {});
    }
    return;
  }

  const registeredResult = callRegisteredHook(name, args);
  if (registeredResult.called) {
    if (isPlayableMedia(registeredResult.result)) {
      activeMedia[channel] = registeredResult.result;
      registeredResult.result.currentTime = 0;
      registeredResult.result.play().catch(() => {});
    }
    return;
  }

  fallback();
}

/**
 * Registers custom sound hook functions, replacing the default no-ops for any provided keys.
 * @param {{playSpinSound?: Function, playStopSound?: Function, playWinSound?: Function, playLossSound?: Function, playMilestoneSound?: Function, playBalanceCountSound?: Function}} hooks
 */
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
  if (typeof hooks.playLossSound === 'function') {
    registeredHooks.playLossSound = hooks.playLossSound;
  }
  if (typeof hooks.playMilestoneSound === 'function') {
    registeredHooks.playMilestoneSound = hooks.playMilestoneSound;
  }
  if (typeof hooks.playBalanceCountSound === 'function') {
    registeredHooks.playBalanceCountSound = hooks.playBalanceCountSound;
  }
}

/**
 * Plays the spin sound, stopping any active win sound first.
 */
export function playSpinSound() {
  stopChannel('win');
  runHook('spin', 'playSpinSound', [], playFallbackSpin);
}

/**
 * Plays the reel-stop click sound.
 */
export function playStopSound() {
  runHook('stop', 'playStopSound', [], playFallbackStop);
}

/**
 * Plays the win sound for the given tier, stopping any active spin sound first.
 * @param {'jackpot' | 'big' | 'medium' | 'small' | 'loss'} tier - Win tier key.
 */
export function playWinSound(tier) {
  stopChannel('spin');
  runHook('win', 'playWinSound', [tier], () => playFallbackWin(tier));
}

/**
 * Plays the loss sound.
 */
export function playLossSound() {
  runHook('loss', 'playLossSound', [], playFallbackLoss);
}

/**
 * Plays the milestone reward chime.
 */
export function playMilestoneSound() {
  runHook('milestone', 'playMilestoneSound', [], playFallbackMilestone);
}

/**
 * Plays the balance counting sound for the given animation duration.
 * @param {number} [durationMs=900] - Approximate duration of the balance counter animation in ms.
 */
export function playBalanceCountSound(durationMs = 900) {
  runHook('count', 'playBalanceCountSound', [durationMs], () =>
    playFallbackBalanceCount(durationMs)
  );
}
