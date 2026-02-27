import { state } from '../data/state.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { broadcast } from '../utils/network.js';
import { startMathRound } from './math.js';

export const startThemeReveal = (theme) => {
  showScreen('screen-theme');
  AudioEngine.fanfare();
  
  const emojiEl = document.getElementById('theme-emoji');
  const nameEl = document.getElementById('theme-name');
  const tagsEl = document.getElementById('theme-tags');
  const continueBtn = document.getElementById('btn-theme-continue');
  
  emojiEl.textContent = theme.emoji;
  nameEl.textContent = theme.name;
  
  tagsEl.innerHTML = '';
  theme.tags.forEach((tag, i) => {
    const span = document.createElement('span');
    span.className = 'tag-pill';
    span.style.animationDelay = `${i * 0.12}s`;
    span.textContent = tag;
    tagsEl.appendChild(span);
  });
  
  continueBtn.onclick = () => {
    AudioEngine.click();
    if (state.isHost) {
      state.currentPlayerIndex = 0;
      broadcast({ type: 'START_MATH', playerIndex: state.currentPlayerIndex });
      startMathRound();
    } else {
      showScreen('screen-waiting');
    }
  };
};
