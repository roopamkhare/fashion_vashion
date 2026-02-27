import { state, resetGameState } from '../data/state.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { Confetti } from '../components/confetti.js';
import { broadcast } from '../utils/network.js';
import { HighScores } from '../components/highScores.js';

const WINNER_SUBTITLES = [
  (name) => `${name} has amazing style! 🌟`,
  (name) => `The fashion crown belongs to ${name}! 👑`,
  (name) => `${name} is a total trendsetter! 💅`,
  (name) => `Everyone's looking at ${name}! 🎀`,
  (name) => `${name} just slayed the runway! 🔥`,
];

export const showWinner = () => {
  showScreen('screen-winner');
  AudioEngine.fanfare();

  const sortedPlayers = [...state.players].sort((a, b) => (b.score + b.coins) - (a.score + a.coins));
  const winner = sortedPlayers[0];
  const totalScore = winner.score + winner.coins;

  document.getElementById('winner-name').textContent = `${winner.name} Wins!`;

  const subtitleFn = WINNER_SUBTITLES[Math.floor(Math.random() * WINNER_SUBTITLES.length)];
  document.getElementById('winner-sub').textContent = subtitleFn(winner.name);
  
  const table = document.getElementById('score-table');
  table.innerHTML = `
    <div class="st-header">
      <div>Player</div>
      <div>Score</div>
      <div>Coins</div>
      <div>Total</div>
    </div>
  `;
  
  sortedPlayers.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = `st-row ${i === 0 ? 'winner-row' : ''}`;
    row.style.animationDelay = `${i * 0.12}s`;
    row.innerHTML = `
      <div class="st-player">${i === 0 ? '👑 ' : ''}${p.name}</div>
      <div class="st-val">${p.score}</div>
      <div class="st-val">🪙 ${p.coins}</div>
      <div class="st-total">${p.score + p.coins}</div>
    `;
    table.appendChild(row);
  });
  
  if (state.isHost && HighScores.isHighScore(totalScore)) {
    HighScores.add(winner.name, totalScore);
    document.getElementById('high-score-notice').textContent = '🎉 New High Score! 🎉';
  } else {
    document.getElementById('high-score-notice').textContent = '';
  }
  
  Confetti.start();
  
  setTimeout(() => Confetti.stop(), 5000);
  
  const playAgainBtn = document.getElementById('btn-play-again');
  if (state.isHost) {
    playAgainBtn.classList.remove('hidden');
    playAgainBtn.onclick = () => {
      resetGameState();
      broadcast({ type: 'LOBBY_UPDATE', players: state.players, difficulty: state.difficulty });
      showScreen('screen-lobby');
    };
  } else {
    playAgainBtn.classList.add('hidden');
  }
};
