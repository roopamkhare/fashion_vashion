import { state } from '../data/state.js';
import { initPeer, createRoom, joinRoom, broadcast } from '../utils/network.js';
import { AudioEngine } from '../utils/audio.js';
import { THEMES } from '../data/constants.js';
import { randInt } from '../utils/math.js';
import { HighScores } from '../components/highScores.js';
import { switchScreen } from '../utils/dom.js';

export const initStartScreen = () => {
  const hostBtn = document.getElementById('btn-host');
  const joinBtn = document.getElementById('btn-join');
  const startGameBtn = document.getElementById('btn-start-game');
  
  const scores = HighScores.load();
  const preview = document.getElementById('high-scores-preview');
  if (scores.length > 0) {
    preview.textContent = `🏆 Top Score: ${scores[0].name} (${scores[0].score})`;
  }
  
  hostBtn.addEventListener('click', () => {
    AudioEngine.click();
    const name = document.getElementById('player-name').value.trim() || 'Host';
    const diff = document.getElementById('player-diff').value;
    
    // Generate a random 4-char code for the host ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    initPeer((id) => {
      createRoom(name, diff);
      showScreen('screen-lobby');
    }, `RBB-${code}`);
  });
  
  joinBtn.addEventListener('click', () => {
    AudioEngine.click();
    const name = document.getElementById('player-name').value.trim() || 'Player';
    const code = document.getElementById('join-code').value.trim();
    
    if (!code) {
      alert('Please enter a room code!');
      return;
    }
    
    initPeer((id) => {
      joinRoom(code, name);
    });
  });
  
  startGameBtn.addEventListener('click', () => {
    AudioEngine.click();
    if (state.players.length < 2) {
      alert('Need at least 2 players to start!');
      return;
    }
    
    const theme = THEMES[randInt(0, THEMES.length - 1)];
    state.currentTheme = theme;
    
    broadcast({ type: 'START_GAME', players: state.players, theme: theme, difficulty: state.difficulty });
    
    // Host starts too
    import('./theme.js').then(m => m.startThemeReveal(theme));
  });
};

export const updateLobbyUI = () => {
  const codeDisplay = document.getElementById('lobby-code');
  const playerList = document.getElementById('lobby-player-list');
  const startBtn = document.getElementById('btn-start-game');
  const waitingMsg = document.getElementById('lobby-waiting-msg');
  const playerCount = document.getElementById('player-count');
  
  if (state.isHost) {
    codeDisplay.textContent = state.roomCode;
    startBtn.classList.remove('hidden');
    waitingMsg.classList.add('hidden');
  } else {
    codeDisplay.textContent = state.roomCode;
    startBtn.classList.add('hidden');
    waitingMsg.classList.remove('hidden');
  }
  
  playerCount.textContent = state.players.length;
  
  playerList.innerHTML = '';
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `👤 ${p.name} ${p.id === state.myId ? '(You)' : ''}`;
    playerList.appendChild(li);
  });
};

export const showScreen = (screenId) => {
  switchScreen(screenId);
};
