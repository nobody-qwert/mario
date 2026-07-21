/**
 * Procedural audio system using the Web Audio API.
 * All sounds are generated at runtime — no external audio files.
 */

// ---------------------------------------------------------------------------
// Audio context singleton (lazy, with autoplay-policy handling)
// ---------------------------------------------------------------------------

let _audioCtx = null;

function getAudioContext() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Autoplay policy: resume context if it was suspended
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

// ---------------------------------------------------------------------------
// Noise helper — generates white noise via a ScriptProcessorNode (legacy but
// widely supported) and returns an AudioBufferSourceNode.
// ---------------------------------------------------------------------------

/**
 * Create a short burst of white noise as an AudioBufferSourceNode.
 * @param {number} duration  - Duration in seconds. Default 0.15.
 * @returns {AudioBufferSourceNode}
 */
function createNoise(duration = 0.15) {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    // White noise: uniform random in [-1, 1]
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

// ---------------------------------------------------------------------------
// Public sound functions
// ---------------------------------------------------------------------------

/**
 * Play a gunshot sound — short noise burst with a quick pitch sweep.
 */
export function playGunshot() {
  const ctx = getAudioContext();

  // Noise component (the "crack")
  const noiseSrc = createNoise(0.12);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  noiseSrc.connect(noiseGain).connect(ctx.destination);
  noiseSrc.start();

  // Low-frequency thump (the "boom")
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);

  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.6, ctx.currentTime);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(thumpGain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Play a hit/impact sound — mid-frequency short tone with noise.
 */
export function playHit() {
  const ctx = getAudioContext();

  // Impact thud (low sine)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);

  // Short noise burst for the "hit" texture
  const noiseSrc = createNoise(0.06);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  // Band-pass filter to shape the noise
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 2000;
  bpf.Q.value = 1;

  noiseSrc.connect(bpf).connect(noiseGain).connect(ctx.destination);
  noiseSrc.start();
}

/**
 * Play an enemy death sound — descending tone with a fade-out.
 */
export function playEnemyDeath() {
  const ctx = getAudioContext();

  // Descending sawtooth (the "wail")
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);

  // Noise tail (the "crumble")
  const noiseSrc = createNoise(0.35);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  noiseSrc.connect(noiseGain).connect(ctx.destination);
  noiseSrc.start();
}

/**
 * Play a jump sound — short upward frequency sweep.
 */
export function playJump() {
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}
