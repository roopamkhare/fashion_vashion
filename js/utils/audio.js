export const AudioEngine = (() => {
  let ctx = null;

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };

  // Plays a single tone
  const tone = (freq, duration, type = 'sine', vol = 0.35) => {
    try {
      const c    = getCtx();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (_) { /* Audio not supported — silent */ }
  };

  return {
    correct()  { tone(880, 0.1); setTimeout(() => tone(1100, 0.18), 100); },
    wrong()    { tone(220, 0.3, 'sawtooth', 0.22); },
    tick()     { tone(660, 0.05, 'square', 0.1); },
    click()    { tone(750, 0.06, 'square', 0.18); },
    select()   { tone(1000, 0.07, 'square', 0.14); },
    deselect() { tone(600, 0.07, 'square', 0.1); },
    fanfare()  { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22), i * 130)); },
  };
})();
