import { state, resetState } from '../data/state.js';
import { PLAYER_EMOJIS, MAX_QUESTIONS } from '../data/constants.js';
import { setText, setHTML, switchScreen } from '../utils/dom.js';
import { AudioEngine } from '../utils/audio.js';
import { Confetti } from '../components/confetti.js';
import { HighScores } from '../components/highScores.js';
import { clearTimer } from '../components/timer.js';
import { renderHighScoresPreview } from './start.js';

const calculateStyleScore = (playerIndex) => {
  const themeTags = new Set(state.theme.tags);
  return state.players[playerIndex].selectedItems
    .flatMap(item => item.tags)
    .filter(tag => themeTags.has(tag))
    .length;
};

const calculateWinner = () => {
  state.players.forEach((p, i) => {
    p.styleScore  = calculateStyleScore(i);
    p.mathScore   = Math.round((p.correctCount / MAX_QUESTIONS) * 100);

    const spent         = p.selectedItems.reduce((s, item) => s + item.price, 0);
    const leftoverRatio = p.coins > 0 ? (p.coins - spent) / p.coins : 0;
    p.budgetBonus = Math.round(Math.max(0, Math.min(1, leftoverRatio)) * 30);

    p.totalScore = (p.styleScore * 10) + p.mathScore + p.budgetBonus;
  });

  const [p0, p1] = state.players;
  if (p0.totalScore > p1.totalScore) return 0;
  if (p1.totalScore > p0.totalScore) return 1;
  return -1; // tie
};

export const showWinnerScreen = () => {
  const winnerIndex = calculateWinner();
  const [p0, p1]    = state.players;

  const crownEl = document.getElementById('winner-crown');
  const subEl   = document.getElementById('winner-sub');

  if (winnerIndex === -1) {
    setText('winner-name', "It's a Tie! 🤝");
    if (subEl)   subEl.textContent = 'Both players are fashion stars! ✨';
    if (crownEl) crownEl.textContent = '🎉';
  } else {
    const w = state.players[winnerIndex];
    setText('winner-name', `${w.name} Wins!`);
    if (subEl)   subEl.textContent = 'Congratulations, fashion star! 🌟';
    if (crownEl) crownEl.textContent = '👑';
  }

  // Score table
  setHTML('score-table', `
    <div class="st-header">
      <span>Player</span><span>Math %</span><span>Style</span><span>Total</span>
    </div>
    ${[p0, p1].map((p, i) => `
      <div class="st-row ${winnerIndex === i ? 'winner-row' : ''}" style="animation-delay:${i * 0.18}s">
        <span class="st-player">${PLAYER_EMOJIS[i]} ${p.name}</span>
        <span class="st-val">${p.mathScore}%</span>
        <span class="st-val">${p.styleScore} pts</span>
        <span class="st-total">${p.totalScore}</span>
      </div>
    `).join('')}
    <div style="font-size:0.72rem;color:var(--text-mid);padding:0.5rem 0.2rem;text-align:right">
      Style pts × 10  +  Math %  +  Budget Bonus (max 30)
    </div>
  `);

  // High score check (save winner's score)
  const hsEl = document.getElementById('high-score-notice');
  if (winnerIndex >= 0) {
    const winner = state.players[winnerIndex];
    if (HighScores.isHighScore(winner.totalScore)) {
      HighScores.add(winner.name, winner.totalScore);
      if (hsEl) hsEl.textContent = `🏆 New High Score for ${winner.name}! (${winner.totalScore} pts)`;
    } else {
      if (hsEl) hsEl.textContent = '';
    }
  } else {
    if (hsEl) hsEl.textContent = '';
  }

  switchScreen('screen-winner');
  Confetti.start();
  AudioEngine.fanfare();

  document.getElementById('btn-play-again').onclick = () => {
    AudioEngine.click();
    Confetti.stop();
    resetGame();
  };
};

const resetGame = () => {
  clearTimer();
  resetState();
  document.getElementById('player1-name').value = '';
  document.getElementById('player2-name').value = '';
  renderHighScoresPreview();
  switchScreen('screen-start');
};
