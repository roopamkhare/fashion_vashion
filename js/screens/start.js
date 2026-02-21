import { state, resetState } from '../data/state.js';
import { HighScores } from '../components/highScores.js';
import { AudioEngine } from '../utils/audio.js';
import { switchScreen } from '../utils/dom.js';
import { renderThemeScreen } from './theme.js';

export const initStartScreen = () => {
  renderHighScoresPreview();

  document.getElementById('btn-start').addEventListener('click', () => {
    AudioEngine.click();
    const name1 = document.getElementById('player1-name').value.trim() || 'Player 1';
    const name2 = document.getElementById('player2-name').value.trim() || 'Player 2';

    resetState();
    state.players[0].name = name1;
    state.players[1].name = name2;

    renderThemeScreen();
    switchScreen('screen-theme');
  });

  // Allow Enter key on inputs to start game
  ['player1-name', 'player2-name'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-start').click();
    });
  });
};

export const renderHighScoresPreview = () => {
  const el     = document.getElementById('high-scores-preview');
  const scores = HighScores.load();
  if (!el || scores.length === 0) return;
  el.innerHTML = `<strong>🏆 Top Scores:</strong> ` +
    scores.slice(0, 3).map(s => `${s.name} <b>${s.score}</b>`).join(' &nbsp;·&nbsp; ');
};
