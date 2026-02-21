import { state } from '../data/state.js';
import { MAX_QUESTIONS, COINS_PER_CORRECT, PLAYER_EMOJIS } from '../data/constants.js';
import { randInt, shuffleArray } from '../utils/math.js';
import { setText, setHTML, switchScreen } from '../utils/dom.js';
import { AudioEngine } from '../utils/audio.js';
import { startTimer, clearTimer } from '../components/timer.js';
import { startBoutiqueRound } from './boutique.js';

export const startMathRound = (playerIndex) => {
  state.currentMathPlayer  = playerIndex;
  state.questionIndex      = 0;

  const p = state.players[playerIndex];
  p.coins        = 0;
  p.correctCount = 0;

  // Reset UI
  setText('math-player-name',  p.name);
  setText('math-player-emoji', PLAYER_EMOJIS[playerIndex]);
  setText('math-coins', '0');

  for (let i = 0; i < MAX_QUESTIONS; i++) {
    const pip = document.getElementById(`pip-${i}`);
    if (pip) pip.className = 'pip';
  }

  switchScreen('screen-math');
  loadNextQuestion();
};

const makeChoices = (correct) => {
  const wrongs = new Set();
  let attempts = 0;
  while (wrongs.size < 3 && attempts < 60) {
    attempts++;
    const delta = randInt(-15, 15);
    const w = correct + delta;
    if (w !== correct && w >= 0 && !wrongs.has(w)) wrongs.add(w);
  }
  // Fallback if loop exhausts
  while (wrongs.size < 3) wrongs.add(correct + wrongs.size + 1);
  const choices = shuffleArray([correct, ...wrongs]);
  return { choices, correctIndex: choices.indexOf(correct) };
};

const genAddition = () => {
  const a  = randInt(14, 75);
  const b  = randInt(11, 75);
  const correct = a + b;
  const { choices, correctIndex } = makeChoices(correct);
  return { text: `${a} + ${b} = ?`, correct, choices, correctIndex };
};

const genSubtraction = () => {
  const a = randInt(30, 99);
  const b = randInt(10, a - 5);
  const correct = a - b;
  const { choices, correctIndex } = makeChoices(correct);
  return { text: `${a} − ${b} = ?`, correct, choices, correctIndex };
};

const genMultiplication = () => {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const correct = a * b;
  const { choices, correctIndex } = makeChoices(correct);
  return { text: `${a} × ${b} = ?`, correct, choices, correctIndex };
};

const genWordProblem = () => {
  const templates = [
    () => {
      const total = randInt(35, 80);
      const spent = randInt(10, total - 5);
      return { text: `You have 🪙 ${total} coins and spend 🪙 ${spent} on shoes.\nHow many coins are left?`, correct: total - spent };
    },
    () => {
      const a = randInt(8, 25);
      const b = randInt(8, 25);
      return { text: `A dress costs 🪙 ${a} and a bag costs 🪙 ${b}.\nHow much do they cost in total?`, correct: a + b };
    },
    () => {
      const packs = randInt(2, 5);
      const each  = randInt(4, 9);
      return { text: `You buy ${packs} packs of hair clips.\nEach pack costs 🪙 ${each}. Total cost?`, correct: packs * each };
    },
    () => {
      const budget = randInt(40, 65);
      const a = randInt(10, 18);
      const b = randInt(6, 14);
      const c = randInt(4, 10);
      const left = budget - a - b - c;
      if (left < 0) return null; // flag for retry
      return { text: `You have 🪙 ${budget}. You buy items for 🪙 ${a}, 🪙 ${b} and 🪙 ${c}.\nHow many coins are left?`, correct: left };
    },
  ];

  // Pick a valid template (retry once for template 3)
  let tpl = null;
  let attempts = 0;
  while (!tpl && attempts < 10) {
    tpl = templates[randInt(0, templates.length - 1)]();
    attempts++;
  }
  if (!tpl) return genAddition();

  const { choices, correctIndex } = makeChoices(tpl.correct);
  return { text: tpl.text, correct: tpl.correct, choices, correctIndex };
};

const generateQuestion = () => {
  const type = randInt(0, 3);
  switch (type) {
    case 0:  return genAddition();
    case 1:  return genSubtraction();
    case 2:  return genMultiplication();
    default: return genWordProblem();
  }
};

const checkAnswer = (selectedIndex) =>
  selectedIndex === state.currentQuestion.correctIndex;

const loadNextQuestion = () => {
  const q = generateQuestion();
  state.currentQuestion = q;

  setText('math-q-num',    `Question ${state.questionIndex + 1}`);
  setText('question-text', q.text);
  setText('math-coins',    state.players[state.currentMathPlayer].coins.toString());

  // Populate answer buttons
  document.querySelectorAll('.answer-btn').forEach((btn, i) => {
    btn.textContent = q.choices[i];
    btn.className   = 'answer-btn';
    btn.disabled    = false;
    btn.onclick     = () => handleAnswer(i);
  });

  // Clear feedback
  const fb = document.getElementById('feedback-banner');
  if (fb) { fb.textContent = ''; fb.className = 'feedback-banner'; }

  startTimer(() => handleAnswer(null)); // null = time expired
};

const handleAnswer = (selectedIndex) => {
  clearTimer();

  const isCorrect        = selectedIndex !== null && checkAnswer(selectedIndex);
  const { correctIndex } = state.currentQuestion;

  // Lock buttons and show colour feedback
  document.querySelectorAll('.answer-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === selectedIndex) btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (i === correctIndex && !isCorrect) btn.classList.add('reveal-correct');
  });

  // Feedback banner
  const fb = document.getElementById('feedback-banner');
  if (fb) {
    if (selectedIndex === null) {
      fb.textContent = "⏰ Time's up!";
      fb.className   = 'feedback-banner wrong';
    } else if (isCorrect) {
      fb.textContent = `✅ Correct! +${COINS_PER_CORRECT} coins!`;
      fb.className   = 'feedback-banner correct';
    } else {
      fb.textContent = `❌ Answer was ${state.currentQuestion.correct}`;
      fb.className   = 'feedback-banner wrong';
    }
  }

  // Audio
  isCorrect ? AudioEngine.correct() : AudioEngine.wrong();

  // Update state
  const p = state.players[state.currentMathPlayer];
  if (isCorrect) {
    p.correctCount++;
    p.coins += COINS_PER_CORRECT;
    setText('math-coins', p.coins.toString());
  }

  // Update pip
  const pip = document.getElementById(`pip-${state.questionIndex}`);
  if (pip) pip.classList.add(isCorrect ? 'correct' : 'wrong');

  state.questionIndex++;

  setTimeout(() => {
    if (state.questionIndex < MAX_QUESTIONS) {
      loadNextQuestion();
    } else {
      showMathResults();
    }
  }, 1500);
};

const showMathResults = () => {
  const pi = state.currentMathPlayer;
  const p  = state.players[pi];
  const pct  = Math.round((p.correctCount / MAX_QUESTIONS) * 100);
  const stars = p.correctCount >= 5 ? '⭐⭐⭐' : p.correctCount >= 3 ? '⭐⭐' : '⭐';

  setText('math-results-title', `${PLAYER_EMOJIS[pi]} ${p.name}'s Round Done!`);

  setHTML('math-results-summary', `
    <div class="result-row">
      <span class="label">Correct Answers</span>
      <span class="value">${p.correctCount} / ${MAX_QUESTIONS} ${stars}</span>
    </div>
    <div class="result-row">
      <span class="label">Accuracy</span>
      <span class="value">${pct}%</span>
    </div>
    <div class="result-row">
      <span class="label">Coins Earned</span>
      <span class="value coin">🪙 ${p.coins}</span>
    </div>
  `);

  const continueBtn = document.getElementById('btn-math-results-continue');
  if (pi === 0) {
    // Player 1 done — hand off to player 2
    continueBtn.textContent = `${PLAYER_EMOJIS[1]} ${state.players[1].name}'s Turn!`;
    continueBtn.onclick = () => { AudioEngine.click(); startMathRound(1); };
  } else {
    // Both math rounds done — start boutique
    continueBtn.textContent = `${PLAYER_EMOJIS[0]} ${state.players[0].name} — Go Shopping! 🛍️`;
    continueBtn.onclick = () => { AudioEngine.click(); startBoutiqueRound(0); };
  }

  switchScreen('screen-math-results');
};
