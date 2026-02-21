import { state } from '../data/state.js';
import { THEMES, PLAYER_EMOJIS } from '../data/constants.js';
import { randInt } from '../utils/math.js';
import { setText } from '../utils/dom.js';
import { AudioEngine } from '../utils/audio.js';
import { startMathRound } from './math.js';

export const renderThemeScreen = () => {
  const theme  = THEMES[randInt(0, THEMES.length - 1)];
  state.theme  = theme;

  setText('theme-emoji', theme.emoji);
  setText('theme-name',  theme.name);

  const tagsEl = document.getElementById('theme-tags');
  if (tagsEl) {
    tagsEl.innerHTML = theme.tags
      .map((t, i) => `<span class="tag-pill" style="animation-delay:${0.08 + i * 0.12}s">${t}</span>`)
      .join('');
  }

  const notice = document.getElementById('player-order-notice');
  if (notice) {
    notice.textContent =
      `${PLAYER_EMOJIS[0]} ${state.players[0].name} goes first — then ${PLAYER_EMOJIS[1]} ${state.players[1].name}!`;
  }

  document.getElementById('btn-theme-continue').onclick = () => {
    AudioEngine.click();
    startMathRound(0);
  };
};
