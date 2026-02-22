/* ============================================================
   Pictionary Game — Drawing, Guessing, Scoring
   ============================================================ */
import { state, resetPictionaryState } from '../data/state.js';
import {
  PICTIONARY_WORDS_EASY, PICTIONARY_WORDS_HARD,
  DRAW_TIME, PICTIONARY_ROUNDS, GUESS_POINTS_MAX, DRAWER_POINTS
} from '../data/constants.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { broadcast, sendToHost } from '../utils/network.js';
import { Confetti } from '../components/confetti.js';
import { shuffleArray } from '../utils/math.js';

// ── Canvas state ──────────────────────────────────────────────
let drawCtx = null;       // drawer's canvas context
let viewCtx = null;       // guesser's canvas context
let drawing  = false;
let currentColor = '#000000';
let currentSize  = 6;
let lastX = 0, lastY = 0;
let turnTimer = null;
let _guessCleanup = null;   // tear-down for previous guess listeners

// ── Helpers ───────────────────────────────────────────────────
const pickWord = () => {
  const list = state.difficulty === 'age5'
    ? PICTIONARY_WORDS_EASY
    : PICTIONARY_WORDS_HARD;

  const available = list.filter(w => !state.picUsedWords.includes(w));
  const pool = available.length > 0 ? available : list;       // reset if exhausted
  const word = pool[Math.floor(Math.random() * pool.length)];
  state.picUsedWords.push(word);
  return word;
};

const wordToHint = (word) => word.split('').map(c => c === ' ' ? '  ' : ' _ ').join('');

// ── Public API ────────────────────────────────────────────────

/** Called on ALL clients when a new Pictionary game starts */
export const startPictionaryGame = () => {
  resetPictionaryState();
  startNextTurn();
};

/** Host decides the next turn and broadcasts it */
export const startNextTurn = () => {
  if (!state.isHost) return;

  const drawer = state.players[state.picDrawerIndex];
  const word = pickWord();
  state.picWord = word;
  state.picGuessedBy = [];
  state.picTurnStartTime = Date.now();

  broadcast({
    type: 'PIC_TURN_START',
    drawerId: drawer.id,
    drawerName: drawer.name,
    word: word,                       // only drawer uses this field
    hint: wordToHint(word),
    round: state.picRound,
    startTime: state.picTurnStartTime
  });

  // Host also processes its own turn start
  handleTurnStart({
    drawerId: drawer.id,
    drawerName: drawer.name,
    word: word,
    hint: wordToHint(word),
    round: state.picRound,
    startTime: state.picTurnStartTime
  });
};

/** Every client processes a turn start message */
export const handleTurnStart = (data) => {
  state.picWord = data.word;
  state.picGuessedBy = [];
  state.picTurnStartTime = data.startTime;

  const amDrawer = data.drawerId === state.myId;

  if (amDrawer) {
    showDrawScreen(data);
  } else {
    showGuessScreen(data);
  }
  startTurnTimer(amDrawer);
};

// ── Draw Screen ───────────────────────────────────────────────

const showDrawScreen = (data) => {
  showScreen('screen-pic-draw');

  document.getElementById('pic-round-label').textContent = `Round ${data.round}`;
  document.getElementById('pic-word').textContent = data.word;
  document.getElementById('pic-guessers-list').textContent = '—';

  // Init canvas
  const canvas = document.getElementById('pic-canvas');
  fitCanvas(canvas);
  drawCtx = canvas.getContext('2d');
  drawCtx.fillStyle = '#FFFFFF';
  drawCtx.fillRect(0, 0, canvas.width, canvas.height);
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';

  currentColor = '#000000';
  currentSize = 6;

  // Reset toolbar active states
  document.querySelectorAll('.color-btn').forEach(b => b.classList.toggle('active', b.dataset.color === '#000000'));
  document.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.size) === 6));

  bindDrawEvents(canvas);
  bindToolbar();
};

const fitCanvas = (canvas) => {
  // Use a fixed internal resolution — CSS handles display scaling.
  // Avoids devicePixelRatio issues when the canvas element is cloned.
  canvas.width  = 600;
  canvas.height = 450;
};

const getCanvasPos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  // Map CSS click position → internal canvas coordinates
  return {
    x: (clientX - rect.left) / rect.width  * canvas.width,
    y: (clientY - rect.top)  / rect.height * canvas.height
  };
};

const bindDrawEvents = (canvas) => {
  // Remove old listeners by replacing the canvas element
  const clone = canvas.cloneNode(true);
  canvas.parentElement.replaceChild(clone, canvas);
  drawCtx = clone.getContext('2d');
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';

  const startDraw = (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getCanvasPos(clone, e);
    lastX = pos.x;
    lastY = pos.y;
  };

  const moveDraw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getCanvasPos(clone, e);
    drawLine(drawCtx, lastX, lastY, pos.x, pos.y, currentColor, currentSize);
    
    // Broadcast the stroke
    const msg = { type: 'PIC_DRAW', x1: lastX, y1: lastY, x2: pos.x, y2: pos.y, color: currentColor, size: currentSize };
    if (state.isHost) {
      broadcast(msg);
    } else {
      sendToHost(msg);
    }

    lastX = pos.x;
    lastY = pos.y;
  };

  const endDraw = () => { drawing = false; };

  clone.addEventListener('mousedown',  startDraw);
  clone.addEventListener('mousemove',  moveDraw);
  clone.addEventListener('mouseup',    endDraw);
  clone.addEventListener('mouseleave', endDraw);
  clone.addEventListener('touchstart', startDraw, { passive: false });
  clone.addEventListener('touchmove',  moveDraw,  { passive: false });
  clone.addEventListener('touchend',   endDraw);
  clone.addEventListener('touchcancel', endDraw);
};

const drawLine = (ctx, x1, y1, x2, y2, color, size) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const bindToolbar = () => {
  // Colors
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.onclick = () => {
      currentColor = btn.dataset.color;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  // Sizes
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => {
      currentSize = Number(btn.dataset.size);
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  // Clear
  document.getElementById('btn-pic-clear').onclick = () => {
    const canvas = document.querySelector('#screen-pic-draw canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const msg = { type: 'PIC_CLEAR' };
    if (state.isHost) broadcast(msg);
    else sendToHost(msg);
  };
};

// ── Guess Screen ──────────────────────────────────────────────

const showGuessScreen = (data) => {
  showScreen('screen-pic-guess');

  document.getElementById('pic-guess-round-label').textContent = `Round ${data.round}`;
  document.getElementById('pic-drawer-name').textContent = `🎨 ${data.drawerName} is drawing`;
  document.getElementById('pic-word-hint').textContent = data.hint;

  // Init view canvas
  const canvas = document.getElementById('pic-canvas-view');
  fitCanvas(canvas);
  viewCtx = canvas.getContext('2d');
  viewCtx.fillStyle = '#FFFFFF';
  viewCtx.fillRect(0, 0, canvas.width, canvas.height);
  viewCtx.lineCap = 'round';
  viewCtx.lineJoin = 'round';

  // Clear chat
  const log = document.getElementById('pic-chat-log');
  log.innerHTML = '<div class="chat-msg system-msg">Game started! Type your guess below.</div>';

  // Tear down any previous guess listeners
  if (_guessCleanup) { _guessCleanup(); _guessCleanup = null; }

  const input = document.getElementById('pic-guess-input');
  const guessBtn = document.getElementById('btn-pic-guess');
  input.disabled = false;
  input.value = '';
  input.placeholder = 'Type your guess...';

  // Always read the LIVE element from the DOM (avoids stale references)
  const doGuess = () => {
    const el = document.getElementById('pic-guess-input');
    if (!el || el.disabled) return;
    const guess = el.value.trim();
    if (!guess) return;
    el.value = '';
    sendToHost({ type: 'PIC_GUESS', guess, playerId: state.myId });
  };

  const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); doGuess(); } };
  const onClick = () => doGuess();

  input.addEventListener('keydown', onKey);
  guessBtn.addEventListener('click', onClick);

  // Store cleanup so next call can remove these exact listeners
  _guessCleanup = () => {
    input.removeEventListener('keydown', onKey);
    guessBtn.removeEventListener('click', onClick);
  };

  input.focus();
};

/** Receive draw data on the guess screen */
export const handleDrawData = (data) => {
  if (!viewCtx) return;
  drawLine(viewCtx, data.x1, data.y1, data.x2, data.y2, data.color, data.size);
};

/** Receive clear canvas command */
export const handleClearCanvas = () => {
  if (viewCtx) {
    const canvas = document.getElementById('pic-canvas-view');
    viewCtx.fillStyle = '#FFFFFF';
    viewCtx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

/** Add a chat message to the guess screen log */
export const addChatMessage = (name, text, type = '') => {
  const log = document.getElementById('pic-chat-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  if (type === 'correct-msg') {
    div.textContent = `✅ ${name} guessed it!`;
  } else if (type === 'system-msg') {
    div.textContent = text;
  } else {
    div.innerHTML = `<span class="chat-name">${name}:</span> ${text}`;
  }
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
};

/** Update hint with revealed letters as time progresses */
export const updateHint = (hint) => {
  const el = document.getElementById('pic-word-hint');
  if (el) el.textContent = hint;
};

// ── Timer ─────────────────────────────────────────────────────

const startTurnTimer = (amDrawer) => {
  if (turnTimer) clearInterval(turnTimer);
  let timeLeft = DRAW_TIME;

  const timerEl = document.getElementById(amDrawer ? 'pic-draw-timer' : 'pic-guess-timer');
  if (timerEl) timerEl.textContent = timeLeft;

  turnTimer = setInterval(() => {
    timeLeft--;
    if (timerEl) {
      timerEl.textContent = timeLeft;
      timerEl.parentElement.classList.toggle('urgent', timeLeft <= 10);
    }

    // Reveal a letter hint at certain intervals (host broadcasts)
    if (state.isHost && !amDrawer) {
      // no-op; host handles reveal in its own timer
    }
    if (state.isHost && amDrawer && state.picWord) {
      if (timeLeft === Math.floor(DRAW_TIME * 0.5)) {
        revealLetterHint(1);
      } else if (timeLeft === Math.floor(DRAW_TIME * 0.25)) {
        revealLetterHint(2);
      }
    }

    if (timeLeft <= 0) {
      clearInterval(turnTimer);
      turnTimer = null;
      // Time's up — host ends the turn
      if (state.isHost) {
        endTurn(false);
      }
    }
  }, 1000);
};

const revealLetterHint = (count) => {
  const word = state.picWord;
  if (!word) return;
  const letters = word.split('').map((c, i) => ({ char: c, i })).filter(o => o.char !== ' ');
  const toReveal = shuffleArray(letters).slice(0, count);

  let hint = word.split('').map(c => c === ' ' ? '  ' : ' _ ').join('');
  const hintArr = word.split('').map(c => c === ' ' ? ' ' : '_');
  toReveal.forEach(o => { hintArr[o.i] = o.char; });
  const newHint = hintArr.map(c => c === ' ' ? '  ' : ` ${c} `).join('');

  broadcast({ type: 'PIC_HINT', hint: newHint });
  updateHint(newHint);
};

export const stopTurnTimer = () => {
  if (turnTimer) { clearInterval(turnTimer); turnTimer = null; }
};

// ── Turn End / Reveal ─────────────────────────────────────────

export const endTurn = (allGuessed = false) => {
  if (!state.isHost) return;
  stopTurnTimer();

  const word = state.picWord;
  const drawerId = state.players[state.picDrawerIndex].id;

  // Give drawer points if at least one person guessed
  if (state.picGuessedBy.length > 0) {
    state.picScores[drawerId] = (state.picScores[drawerId] || 0) + DRAWER_POINTS;
  }

  broadcast({
    type: 'PIC_TURN_END',
    word: word,
    scores: { ...state.picScores },
    guessedBy: [...state.picGuessedBy]
  });

  handleTurnEnd({ word, scores: { ...state.picScores }, guessedBy: [...state.picGuessedBy] });
};

export const handleTurnEnd = (data) => {
  stopTurnTimer();
  state.picScores = data.scores;

  showScreen('screen-pic-reveal');

  const noOneGuessed = data.guessedBy.length === 0;
  document.getElementById('pic-reveal-emoji').textContent = noOneGuessed ? '😅' : '🎉';
  document.getElementById('pic-reveal-word').textContent = data.word;

  const scoresDiv = document.getElementById('pic-reveal-scores');
  scoresDiv.innerHTML = '';

  // Sort players by score
  const sorted = [...state.players].sort((a, b) =>
    (state.picScores[b.id] || 0) - (state.picScores[a.id] || 0)
  );
  sorted.forEach(p => {
    const row = document.createElement('div');
    row.className = 'pic-reveal-row';
    row.innerHTML = `<span>${p.name}</span><span class="pts">${state.picScores[p.id] || 0} pts</span>`;
    scoresDiv.appendChild(row);
  });

  // Determine next drawer
  if (state.isHost) {
    setTimeout(() => {
      advanceToNextTurn();
    }, 4000);
  }

  // Show who draws next
  const nextDrawerIdx = (state.picDrawerIndex + 1) % state.players.length;
  const nextRound = nextDrawerIdx === 0 ? state.picRound + 1 : state.picRound;

  if (nextRound > PICTIONARY_ROUNDS) {
    document.getElementById('pic-reveal-next').textContent = 'Final results coming up!';
  } else {
    const nextName = state.players[nextDrawerIdx].name;
    document.getElementById('pic-reveal-next').textContent = `Next up: ${nextName} draws!`;
  }
};

const advanceToNextTurn = () => {
  if (!state.isHost) return;

  state.picDrawerIndex = (state.picDrawerIndex + 1) % state.players.length;
  if (state.picDrawerIndex === 0) {
    state.picRound++;
  }

  if (state.picRound > PICTIONARY_ROUNDS) {
    // Game over!
    broadcast({ type: 'PIC_GAME_OVER', scores: { ...state.picScores } });
    showPictionaryWinner({ scores: { ...state.picScores } });
  } else {
    startNextTurn();
  }
};

// ── Final Scores ──────────────────────────────────────────────

export const showPictionaryWinner = (data) => {
  stopTurnTimer();
  state.picScores = data.scores;
  showScreen('screen-pic-winner');
  AudioEngine.fanfare();

  const sorted = [...state.players].sort((a, b) =>
    (state.picScores[b.id] || 0) - (state.picScores[a.id] || 0)
  );
  const winner = sorted[0];

  document.getElementById('pic-winner-name').textContent = `${winner.name} Wins!`;

  const table = document.getElementById('pic-score-table');
  table.innerHTML = `<div class="st-header"><div>Player</div><div>Points</div></div>`;

  sorted.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = `st-row ${i === 0 ? 'winner-row' : ''}`;
    row.innerHTML = `
      <div class="st-player">${i === 0 ? '👑 ' : ''}${p.name}</div>
      <div class="st-total">${state.picScores[p.id] || 0}</div>
    `;
    row.style.animationDelay = `${i * 0.1}s`;
    table.appendChild(row);
  });

  Confetti.start();
  setTimeout(() => Confetti.stop(), 5000);

  // Play again button
  const btn = document.getElementById('btn-pic-play-again');
  if (state.isHost) {
    btn.classList.remove('hidden');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      AudioEngine.click();
      broadcast({ type: 'LOBBY_UPDATE', players: state.players, difficulty: state.difficulty, gameMode: state.gameMode });
      showScreen('screen-lobby');
    });
  } else {
    btn.classList.add('hidden');
  }
};

// ── Guess Processing (Host only) ──────────────────────────────

export const processGuess = (data) => {
  if (!state.isHost) return;

  try {
    const { guess, playerId } = data;
    const player = state.players.find(p => p.id === playerId);
    if (!player) { console.warn('[Pictionary] Guess from unknown player:', playerId); return; }
    if (!state.picWord) { console.warn('[Pictionary] No word set, ignoring guess'); return; }

    const isCorrect = guess.toLowerCase().trim() === state.picWord.toLowerCase().trim();

    if (isCorrect && !state.picGuessedBy.includes(playerId) && playerId !== state.players[state.picDrawerIndex].id) {
      // Correct!
      state.picGuessedBy.push(playerId);

      // Points based on speed — faster = more points
      const elapsed = (Date.now() - state.picTurnStartTime) / 1000;
      const fraction = Math.max(0, 1 - elapsed / DRAW_TIME);
      const points = Math.round(GUESS_POINTS_MAX * 0.3 + GUESS_POINTS_MAX * 0.7 * fraction);
      state.picScores[playerId] = (state.picScores[playerId] || 0) + points;

      broadcast({ type: 'PIC_CORRECT', playerName: player.name, playerId: playerId, points: points });
      // Also handle locally
      handleCorrectGuess({ playerName: player.name, playerId: playerId, points: points });

      // If all non-drawers have guessed, end turn
      const nonDrawers = state.players.filter(p => p.id !== state.players[state.picDrawerIndex].id);
      if (state.picGuessedBy.length >= nonDrawers.length) {
        setTimeout(() => endTurn(true), 1500);
      }
    } else {
      // Wrong — broadcast the guess to everyone (chat)
      broadcast({ type: 'PIC_CHAT', playerName: player.name, text: guess });
      addChatMessage(player.name, guess);
    }
  } catch (err) {
    console.error('[Pictionary] Error processing guess:', err);
  }
};

export const handleCorrectGuess = (data) => {
  AudioEngine.correct();

  // Sync picGuessedBy on ALL clients (not just host)
  if (!state.picGuessedBy.includes(data.playerId)) {
    state.picGuessedBy.push(data.playerId);
  }

  addChatMessage(data.playerName, '', 'correct-msg');

  // Update guessers bar on draw screen
  const bar = document.getElementById('pic-guessers-list');
  if (bar) {
    const names = state.picGuessedBy.map(id => state.players.find(p => p.id === id)?.name).filter(Boolean);
    bar.textContent = names.length ? names.join(', ') : '—';
  }

  // If I guessed correctly, disable my input
  if (data.playerId === state.myId) {
    const input = document.getElementById('pic-guess-input');
    if (input) { input.disabled = true; input.value = ''; input.placeholder = '✅ You got it!'; }
  }
};
