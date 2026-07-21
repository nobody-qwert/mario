/**
 * sound.js — Audio synthesis via Web Audio API
 */

const Sound = (() => {
  let ctx;
  let master;
  let unlocked = false;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type, gain, slideTo) {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }

  function noise(duration, gain) {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime;
    const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = audio.createBufferSource();
    const amp = audio.createGain();
    source.buffer = buffer;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(amp);
    amp.connect(master);
    source.start(now);
  }

  return {
    unlock() {
      if (unlocked) return;
      ensure();
      unlocked = true;
    },
    play(name) {
      switch (name) {
        case 'start':
          tone(523, 0.08, 'square', 0.12);
          setTimeout(() => tone(784, 0.12, 'square', 0.12), 70);
          break;
        case 'jump':
          tone(330, 0.16, 'square', 0.10, 660);
          break;
        case 'coin':
          tone(988, 0.07, 'square', 0.10);
          setTimeout(() => tone(1319, 0.08, 'square', 0.08), 45);
          break;
        case 'powerup':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => tone(freq, 0.08, 'triangle', 0.10), i * 55);
          });
          break;
        case 'bump':
          tone(180, 0.08, 'square', 0.10, 110);
          break;
        case 'break':
          noise(0.12, 0.12);
          tone(120, 0.09, 'sawtooth', 0.08, 70);
          break;
        case 'stomp':
          tone(220, 0.08, 'square', 0.10, 110);
          break;
        case 'hurt':
          tone(196, 0.20, 'sawtooth', 0.11, 80);
          break;
        case 'warp':
          tone(440, 0.28, 'triangle', 0.10, 110);
          break;
        case 'win':
          [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => {
            setTimeout(() => tone(freq, 0.12, 'square', 0.09), i * 90);
          });
          break;
      }
    }
  };
})();

window.addEventListener('keydown', () => Sound.unlock(), { once: true });
window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
