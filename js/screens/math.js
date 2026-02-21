import { state } from '../data/state.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { generateMathQuestion } from '../utils/math.js';
import { sendToHost } from '../utils/network.js';
import { startTimer, clearTimer } from '../components/timer.js';

export const startMathRound = () => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
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
    pip.className = 'pip';
    pip.id = `pip-${i}`;
    if (i < state.mathQuestionsAnswered) {
      pip.classList.add('correct'); // Simplified for now
    }
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
    banner.textContent = 'Correct! +10 Coins';
    banner.className = 'feedback-banner correct';
    player.coins += 10;
  } else {
    AudioEngine.wrong();
    if (btn) btn.classList.add('wrong');
    banner.textContent = `Oops! The answer was ${state.currentQuestion.answer}`;
    banner.className = 'feedback-banner wrong';
    
    // Highlight correct
    Array.from(document.getElementById('answer-grid').children).forEach(b => {
      if (parseInt(b.textContent) === state.currentQuestion.answer) {
        b.classList.add('reveal-correct');
      }
    });
  }
  
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
  
  state.mathQuestionsAnswered++;
  
  setTimeout(nextQuestion, 1500);
};
