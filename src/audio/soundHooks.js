const defaultHooks = {
  playSpinSound: () => {},
  playStopSound: () => {},
  playWinSound: () => {},
};

const registeredHooks = { ...defaultHooks };

const activeMedia = {
  spin: null,
  stop: null,
  win: null,
};

const activeSynth = {
  spin: { timers: [], nodes: [] },
  stop: { timers: [], nodes: [] },
  win: { timers: [], nodes: [] },
};

let cachedAudioContext = null;

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

function stopSynthChannel(channel) {
  activeSynth[channel].timers.forEach((timerId) => clearTimeout(timerId));
  activeSynth[channel].timers = [];

  activeSynth[channel].nodes.forEach((node) => {
    try {
      node.stop();
    } catch (error) {
      // Node may already be stopped; ignore.
    }
    node.disconnect();
  });
  activeSynth[channel].nodes = [];
}

function stopChannel(channel) {
  stopMedia(channel);
  stopSynthChannel(channel);
}

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
      } catch (error) {
        // Ignore disconnect races.
      }
      try {
        gainNode.disconnect();
      } catch (error) {
        // Ignore disconnect races.
      }
      activeSynth[channel].nodes = activeSynth[channel].nodes.filter((node) => node !== oscillator);
    };
  }, atMs);

  activeSynth[channel].timers.push(timerId);
}

function playFallbackSpin() {
  stopChannel('spin');
  stopChannel('win');

  scheduleTone('spin', { atMs: 0, durationMs: 120, frequency: 215, volume: 0.05, type: 'sawtooth' });
  scheduleTone('spin', { atMs: 120, durationMs: 120, frequency: 180, volume: 0.04, type: 'triangle' });
  scheduleTone('spin', { atMs: 240, durationMs: 90, frequency: 150, volume: 0.03, type: 'triangle' });
}

function playFallbackStop() {
  stopChannel('stop');
  scheduleTone('stop', { atMs: 0, durationMs: 45, frequency: 700, volume: 0.03, type: 'square' });
}

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

function isPlayableMedia(value) {
  return value && typeof value.pause === 'function' && typeof value.play === 'function';
}

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
  stopChannel('win');
  runHook('spin', 'playSpinSound', [], playFallbackSpin);
}

export function playStopSound() {
  runHook('stop', 'playStopSound', [], playFallbackStop);
}

export function playWinSound(tier) {
  stopChannel('spin');
  runHook('win', 'playWinSound', [tier], () => playFallbackWin(tier));
}
