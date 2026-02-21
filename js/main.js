import { initStartScreen } from './screens/start.js';
import { AudioEngine } from './utils/audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio on first interaction
  document.body.addEventListener('click', () => {
    // Just a silent tick to unlock audio context
    AudioEngine.tick();
  }, { once: true });
  
  // Initialize start screen logic
  initStartScreen();
});
