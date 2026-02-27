import { state } from '../data/state.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { generateMathQuestion } from '../utils/math.js';
import { sendToHost } from '../utils/network.js';
import { startTimer, clearTimer } from '../components/timer.js';

// ── Fun feedback messages ──────────────────────────────────────
const CORRECT_MSGS = [
  'Fantastic! 🌟',
  "You're a math star! ⭐",
  'Amazing! 🎉',
  'Brilliant! 🦄',
  'Superstar! 🌈',
  'Nailed it! 🎀',
];

const WRONG_MSGS = [
  "Oops! Keep going! 💪",
  "So close! You can do it! 🔥",
  "Almost! Next one! ⭐",
  "Don't worry, keep trying! 🌟",
];

// ── Module-level state (per round) ────────────────────────────
let pipResults = [];   // 'correct' | 'wrong' per question
let streak = 0;

export const startMathRound = () => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  pipResults = [];
  streak = 0;

  if (currentPlayer.id === state.myId) {
    // It's my turn
    showScreen('screen-math');
    state.mathQuestionsAnswered = 0;
    updateMathUI();
    nextQuestion();
  } else {
    // Waiting for someone else
    showScreen('screen-waiting');
    const waitingList = document.getElementById('waiting-player-list');
    waitingList.innerHTML = `<li><span>${currentPlayer.name}</span><span>is earning coins...</span></li>`;
  }
};

const updateMathUI = () => {
  const player = state.players[state.currentPlayerIndex];
  document.getElementById('math-player-name').textContent = player.name;
  document.getElementById('math-coins').textContent = player.coins;
  document.getElementById('math-q-num').textContent = `Question ${state.mathQuestionsAnswered + 1}`;

  const pips = document.getElementById('pip-row');
  pips.innerHTML = '';
  for (let i = 0; i < state.mathQuestionsTotal; i++) {
    const pip = document.createElement('span');
    pip.className = `pip${pipResults[i] ? ' ' + pipResults[i] : ''}`;
    pip.id = `pip-${i}`;
    pips.appendChild(pip);
  }
};

const nextQuestion = () => {
  if (state.mathQuestionsAnswered >= state.mathQuestionsTotal) {
    // Round over
    const player = state.players[state.currentPlayerIndex];
    sendToHost({ type: 'MATH_COMPLETE', playerId: state.myId, coins: player.coins });
    return;
  }

  state.currentQuestion = generateMathQuestion(state.difficulty);

  // Animate question card sliding in
  const qCard = document.getElementById('question-card');
  qCard.classList.remove('q-slide');
  void qCard.offsetWidth;   // force reflow to re-trigger animation
  qCard.classList.add('q-slide');

  document.getElementById('question-text').textContent = state.currentQuestion.question;

  const grid = document.getElementById('answer-grid');
  grid.innerHTML = '';

  state.currentQuestion.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.dataset.index = index;
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(opt, btn);
    grid.appendChild(btn);
  });

  document.getElementById('feedback-banner').className = 'feedback-banner';
  document.getElementById('feedback-banner').textContent = '';

  updateMathUI();

  clearTimer();
  startTimer(() => {
    handleAnswer(null, null); // Timeout
  });
};

const handleAnswer = (selected, btn) => {
  clearTimer();

  const isCorrect = selected === state.currentQuestion.answer;
  const player = state.players[state.currentPlayerIndex];

  const banner = document.getElementById('feedback-banner');

  if (isCorrect) {
    AudioEngine.correct();
    btn.classList.add('correct');
    player.coins += 10;
    streak++;

    // Pop the coin display
    const coinsEl = document.getElementById('math-coins');
    coinsEl.textContent = player.coins;
    coinsEl.classList.remove('coin-pop');
    void coinsEl.offsetWidth;
    coinsEl.classList.add('coin-pop');

    const msg = CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)];
    if (streak >= 3) {
      banner.textContent = `🔥 ${streak} in a row! ${msg} +10 Coins`;
    } else if (streak === 2) {
      banner.textContent = `⚡ Double! ${msg} +10 Coins`;
    } else {
      banner.textContent = `${msg} +10 Coins`;
    }
    banner.className = 'feedback-banner correct';
  } else {
    AudioEngine.wrong();
    streak = 0;
    if (btn) btn.classList.add('wrong');

    // Highlight correct
    Array.from(document.getElementById('answer-grid').children).forEach(b => {
      if (parseInt(b.textContent) === state.currentQuestion.answer ||
          b.textContent.trim() === String(state.currentQuestion.answer)) {
        b.classList.add('reveal-correct');
      }
    });

    const msg = WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)];
    banner.textContent = `${msg} Answer: ${state.currentQuestion.answer}`;
    banner.className = 'feedback-banner wrong';
  }

  // Record pip result
  pipResults.push(isCorrect ? 'correct' : 'wrong');

  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

  state.mathQuestionsAnswered++;
  updateMathUI();   // update pips immediately after recording result

  setTimeout(nextQuestion, 1500);
};
