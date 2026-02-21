'use strict';
// ============================================================
//  RUNWAY BUDGET BATTLE  —  script.js
//  Vanilla ES6 · No frameworks · Client-side only
// ============================================================

// ============================================================
//  DATA
// ============================================================

const THEMES = [
  { name: 'Beach Party',     emoji: '🏖️',  tags: ['bright',     'casual',    'summery']   },
  { name: 'Winter Gala',     emoji: '❄️',   tags: ['elegant',    'sparkly',   'cozy']      },
  { name: 'Superhero Chic',  emoji: '⚡',   tags: ['bold',       'bright',    'powerful']  },
  { name: 'Pop Star Night',  emoji: '🌟',   tags: ['sparkly',    'glam',      'bold']      },
  { name: 'Fairy Garden',    emoji: '🧚',   tags: ['floral',     'pastel',    'whimsical'] },
  { name: 'Space Explorer',  emoji: '🚀',   tags: ['futuristic', 'bold',      'metallic']  },
  { name: 'Candy Land',      emoji: '🍬',   tags: ['sweet',      'bright',    'pastel']    },
  { name: 'Jungle Safari',   emoji: '🌿',   tags: ['natural',    'casual',    'earthy']    },
];

// ── All shop items ──────────────────────────────────────────
const SHOP_ITEMS = [
  // DRESSES
  { id: 'd1', category: 'dress',     name: 'Sunny Sundress',    emoji: '👗', tags: ['bright','casual','summery'],     price: 15 },
  { id: 'd2', category: 'dress',     name: 'Glitter Gown',      emoji: '👗', tags: ['sparkly','elegant','glam'],      price: 20 },
  { id: 'd3', category: 'dress',     name: 'Floral Wrap Dress', emoji: '👗', tags: ['floral','pastel','whimsical'],   price: 16 },
  { id: 'd4', category: 'dress',     name: 'Power Suit Dress',  emoji: '👗', tags: ['bold','powerful','futuristic'],  price: 18 },
  // SHOES
  { id: 's1', category: 'shoes',     name: 'Sparkle Sneakers',  emoji: '👟', tags: ['bright','casual','summery'],     price: 11 },
  { id: 's2', category: 'shoes',     name: 'Crystal Heels',     emoji: '👠', tags: ['sparkly','elegant','glam'],      price: 14 },
  { id: 's3', category: 'shoes',     name: 'Rainbow Boots',     emoji: '👢', tags: ['bold','whimsical','bright'],     price: 12 },
  { id: 's4', category: 'shoes',     name: 'Silver Skates',     emoji: '⛸️', tags: ['futuristic','metallic','bold'],  price: 13 },
  // BAGS
  { id: 'b1', category: 'bag',       name: 'Beach Tote',        emoji: '👜', tags: ['casual','summery','natural'],    price: 8  },
  { id: 'b2', category: 'bag',       name: 'Glam Clutch',       emoji: '👛', tags: ['sparkly','glam','elegant'],      price: 11 },
  { id: 'b3', category: 'bag',       name: 'Star Backpack',     emoji: '🎒', tags: ['bright','bold','sweet'],         price: 9  },
  { id: 'b4', category: 'bag',       name: 'Candy Bag',         emoji: '👝', tags: ['sweet','pastel','whimsical'],    price: 9  },
  // ACCESSORIES
  { id: 'a1', category: 'accessory', name: 'Flower Crown',      emoji: '🌸', tags: ['floral','pastel','whimsical'],  price: 7  },
  { id: 'a2', category: 'accessory', name: 'Star Sunglasses',   emoji: '🕶️', tags: ['bright','summery','glam'],      price: 6  },
  { id: 'a3', category: 'accessory', name: 'Crystal Tiara',     emoji: '👑', tags: ['sparkly','elegant','bold'],     price: 8  },
  { id: 'a4', category: 'accessory', name: 'Lightning Bolts',   emoji: '⚡', tags: ['bold','powerful','futuristic'], price: 7  },
];

const CATEGORIES = [
  { key: 'dress',     label: '👗 Dresses'     },
  { key: 'shoes',     label: '👠 Shoes'       },
  { key: 'bag',       label: '👜 Bags'        },
  { key: 'accessory', label: '💍 Accessories' },
];

const PLAYER_EMOJIS     = ['🎀', '⭐'];
const MAX_QUESTIONS     = 5;
const COINS_PER_CORRECT = 10;
const QUESTION_TIME     = 20;           // seconds
const TIMER_CIRCUMF     = 2 * Math.PI * 26;   // SVG circle r=26

// ============================================================
//  STATE FACTORY
// ============================================================

const createPlayer = (name) => ({
  name,
  coins:        0,
  correctCount: 0,
  selectedItems:[],   // array of item objects chosen in boutique
  styleScore:   0,
  mathScore:    0,
  budgetBonus:  0,
  totalScore:   0,
});

const createInitialState = () => ({
  players:             [createPlayer('Player 1'), createPlayer('Player 2')],
  theme:               null,
  currentMathPlayer:   0,
  currentBoutiquePlayer: 0,
  currentQuestion:     null,
  questionIndex:       0,
  timerHandle:         null,
  timerSeconds:        QUESTION_TIME,
});

let state = createInitialState();

// ============================================================
//  AUDIO ENGINE  (Web Audio API — no assets needed)
// ============================================================

const AudioEngine = (() => {
  let ctx = null;

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };

  // Plays a single tone
  const tone = (freq, duration, type = 'sine', vol = 0.35) => {
    try {
      const c    = getCtx();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (_) { /* Audio not supported — silent */ }
  };

  return {
    correct()  { tone(880, 0.1); setTimeout(() => tone(1100, 0.18), 100); },
    wrong()    { tone(220, 0.3, 'sawtooth', 0.22); },
    tick()     { tone(660, 0.05, 'square', 0.1); },
    click()    { tone(750, 0.06, 'square', 0.18); },
    select()   { tone(1000, 0.07, 'square', 0.14); },
    deselect() { tone(600, 0.07, 'square', 0.1); },
    fanfare()  { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22), i * 130)); },
  };
})();

// ============================================================
//  SCREEN TRANSITIONS
// ============================================================

const switchScreen = (toId) => {
  const current = document.querySelector('.screen.active');
  const next    = document.getElementById(toId);
  if (!next || next === current) return;

  if (current) {
    current.classList.add('exit');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('exit'), 500);
  }
  next.classList.add('active');
  next.scrollTop = 0;
};

// ============================================================
//  MATH — QUESTION GENERATORS
// ============================================================

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

/**
 * Generate 3 wrong answers that are numeric neighbours of `correct`.
 * Returns { choices: [4 shuffled options], correctIndex }
 */
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

// ============================================================
//  CHECK ANSWER
// ============================================================

const checkAnswer = (selectedIndex) =>
  selectedIndex === state.currentQuestion.correctIndex;

// ============================================================
//  STYLE SCORE
// ============================================================

const calculateStyleScore = (playerIndex) => {
  const themeTags = new Set(state.theme.tags);
  return state.players[playerIndex].selectedItems
    .flatMap(item => item.tags)
    .filter(tag => themeTags.has(tag))
    .length;
};

// ============================================================
//  WINNER CALCULATION
// ============================================================

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

// ============================================================
//  TIMER
// ============================================================

const clearTimer = () => {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
};

const renderTimerRing = (seconds) => {
  const fill = document.getElementById('timer-ring-fill');
  const text = document.getElementById('timer-text');
  if (!fill || !text) return;

  const ratio  = seconds / QUESTION_TIME;
  fill.style.strokeDashoffset = TIMER_CIRCUMF * (1 - ratio);
  fill.classList.toggle('warning', seconds <= 5);
  text.textContent = seconds;
};

const startTimer = (onExpire) => {
  clearTimer();
  state.timerSeconds = QUESTION_TIME;
  renderTimerRing(QUESTION_TIME);

  state.timerHandle = setInterval(() => {
    state.timerSeconds--;
    renderTimerRing(state.timerSeconds);
    if (state.timerSeconds <= 5) AudioEngine.tick();
    if (state.timerSeconds <= 0) {
      clearTimer();
      onExpire();
    }
  }, 1000);
};

// ============================================================
//  CONFETTI
// ============================================================

const Confetti = (() => {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  const COLORS = ['#ff85c2','#c77dff','#72efdd','#ffe066','#ff6b6b','#74c0fc','#3bc47e','#ffd6a5'];
  let particles = [];
  let rafId     = null;

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

  const makeParticle = () => ({
    x:    Math.random() * window.innerWidth,
    y:    Math.random() * window.innerHeight - window.innerHeight,
    w:    randInt(7, 15),
    h:    randInt(4, 9),
    color: COLORS[randInt(0, COLORS.length - 1)],
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 6,
    vy:   randInt(3, 7),
    vx:   (Math.random() - 0.5) * 2.5,
  });

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
    });
    particles = particles.filter(p => p.y < canvas.height + 30);
    if (particles.length > 0) rafId = requestAnimationFrame(draw);
    else stop();
  };

  const start = () => {
    resize();
    canvas.style.display = 'block';
    for (let i = 0; i < 200; i++) particles.push(makeParticle());
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
    window.removeEventListener('resize', resize);
  };

  return { start, stop };
})();

// ============================================================
//  HIGH SCORES  (localStorage)
// ============================================================

const HighScores = (() => {
  const KEY = 'runway_budget_battle_v1';
  const MAX = 5;

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (_) { return []; }
  };

  const save = (scores) => {
    try { localStorage.setItem(KEY, JSON.stringify(scores)); }
    catch (_) { /* storage unavailable */ }
  };

  const add = (name, score) => {
    const scores = load();
    scores.push({ name, score, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    save(scores.slice(0, MAX));
  };

  const isHighScore = (score) => {
    const scores = load();
    return scores.length < MAX || score > (scores.at(-1)?.score ?? 0);
  };

  return { load, add, isHighScore };
})();

// ============================================================
//  DOM HELPERS
// ============================================================

const qs      = (sel, root = document) => root.querySelector(sel);
const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML  = val; };

// ============================================================
//  ① START SCREEN
// ============================================================

const initStartScreen = () => {
  renderHighScoresPreview();

  document.getElementById('btn-start').addEventListener('click', () => {
    AudioEngine.click();
    const name1 = document.getElementById('player1-name').value.trim() || 'Player 1';
    const name2 = document.getElementById('player2-name').value.trim() || 'Player 2';

    state = createInitialState();
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

const renderHighScoresPreview = () => {
  const el     = document.getElementById('high-scores-preview');
  const scores = HighScores.load();
  if (!el || scores.length === 0) return;
  el.innerHTML = `<strong>🏆 Top Scores:</strong> ` +
    scores.slice(0, 3).map(s => `${s.name} <b>${s.score}</b>`).join(' &nbsp;·&nbsp; ');
};

// ============================================================
//  ② THEME SCREEN
// ============================================================

const renderThemeScreen = () => {
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

// ============================================================
//  ③ MATH ROUND
// ============================================================

const startMathRound = (playerIndex) => {
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

// ============================================================
//  MATH RESULTS SCREEN
// ============================================================

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

// ============================================================
//  ④ BOUTIQUE ROUND
// ============================================================

const getSpentCoins = (playerIndex) =>
  state.players[playerIndex].selectedItems.reduce((sum, i) => sum + i.price, 0);

const getRemainingCoins = (playerIndex) =>
  state.players[playerIndex].coins - getSpentCoins(playerIndex);

const startBoutiqueRound = (playerIndex) => {
  state.currentBoutiquePlayer = playerIndex;
  state.players[playerIndex].selectedItems = [];

  const p = state.players[playerIndex];
  setText('boutique-player-name',  p.name);
  setText('boutique-player-emoji', PLAYER_EMOJIS[playerIndex]);

  const budgetEl = document.getElementById('budget-coins');
  if (budgetEl) { budgetEl.textContent = `🪙 ${p.coins}`; budgetEl.className = 'budget-coins'; }

  const themeMini = document.getElementById('boutique-theme-mini');
  if (themeMini) themeMini.textContent = `${state.theme.emoji} ${state.theme.name}`;

  renderShopCategories(playerIndex);
  renderOutfitPreview(playerIndex);

  document.getElementById('btn-boutique-done').onclick = () => {
    AudioEngine.click();
    endBoutiqueRound(playerIndex);
  };

  switchScreen('screen-boutique');
};

// ── Shop grid ────────────────────────────────────────────────

const renderShopCategories = (playerIndex) => {
  const container = document.getElementById('shop-categories');
  if (!container) return;
  container.innerHTML = '';

  const themeTags = new Set(state.theme.tags);

  CATEGORIES.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'shop-category';

    const h3 = document.createElement('h3');
    h3.textContent = cat.label;
    section.appendChild(h3);

    const grid = document.createElement('div');
    grid.className = 'shop-items';

    SHOP_ITEMS
      .filter(item => item.category === cat.key)
      .forEach(item => grid.appendChild(buildItemCard(item, playerIndex, themeTags)));

    section.appendChild(grid);
    container.appendChild(section);
  });
};

const buildItemCard = (item, playerIndex, themeTags) => {
  const p          = state.players[playerIndex];
  const isSelected = p.selectedItems.some(s => s.id === item.id);
  const remaining  = getRemainingCoins(playerIndex);

  // If another item in same category is currently selected, those coins would be freed
  const swapItem   = p.selectedItems.find(s => s.category === item.category && s.id !== item.id);
  const freed      = swapItem ? swapItem.price : 0;
  const canAfford  = isSelected || item.price <= remaining + freed;

  const card = document.createElement('div');
  card.className = 'shop-item';
  if (isSelected)  card.classList.add('selected');
  if (!canAfford)  card.classList.add('cant-afford');

  const tagsHTML = item.tags
    .map(t => `<span class="item-tag ${themeTags.has(t) ? 'match' : ''}">${t}</span>`)
    .join('');

  card.innerHTML = `
    <span class="item-emoji">${item.emoji}</span>
    <div class="item-name">${item.name}</div>
    <div class="item-price">🪙 ${item.price}</div>
    <div class="item-tags">${tagsHTML}</div>
  `;

  card.addEventListener('click', () => {
    if (!canAfford && !isSelected) { /* can't afford */ return; }
    handleItemToggle(item, playerIndex);
  });

  return card;
};

const handleItemToggle = (item, playerIndex) => {
  const p   = state.players[playerIndex];
  const idx = p.selectedItems.findIndex(s => s.id === item.id);

  if (idx >= 0) {
    // Deselect
    p.selectedItems.splice(idx, 1);
    AudioEngine.deselect();
  } else {
    // Swap out same-category item if any, then add
    const swapIdx = p.selectedItems.findIndex(s => s.category === item.category);
    if (swapIdx >= 0) p.selectedItems.splice(swapIdx, 1);
    p.selectedItems.push(item);
    AudioEngine.select();
  }

  // Refresh budget display
  const remaining = getRemainingCoins(playerIndex);
  const budgetEl  = document.getElementById('budget-coins');
  if (budgetEl) {
    budgetEl.textContent = `🪙 ${remaining}`;
    budgetEl.className   = remaining < 8 ? 'budget-coins tight' : 'budget-coins';
  }

  renderShopCategories(playerIndex);
  renderOutfitPreview(playerIndex);
};

const renderOutfitPreview = (playerIndex) => {
  const container = document.getElementById('outfit-slots');
  if (!container) return;
  container.innerHTML = '';

  const p = state.players[playerIndex];

  CATEGORIES.forEach(cat => {
    const selected = p.selectedItems.find(i => i.category === cat.key);
    const slot     = document.createElement('div');
    slot.className = selected ? 'outfit-slot filled' : 'outfit-slot';

    if (selected) {
      slot.innerHTML = `
        <span class="outfit-slot-emoji">${selected.emoji}</span>
        <span class="outfit-slot-name">${selected.name}</span>
      `;
    } else {
      const sample = SHOP_ITEMS.find(i => i.category === cat.key);
      slot.innerHTML = `
        <span class="outfit-slot-emoji" style="opacity:0.28">${sample?.emoji ?? '?'}</span>
        <span class="outfit-slot-name" style="opacity:0.38">${cat.label.split(' ').slice(1).join(' ')}</span>
      `;
    }
    container.appendChild(slot);
  });
};

const endBoutiqueRound = (playerIndex) => {
  if (playerIndex === 0) {
    // Player 2's shopping turn
    startBoutiqueRound(1);
  } else {
    // Both shopped — show winner
    showWinnerScreen();
  }
};

// ============================================================
//  ⑥ WINNER SCREEN
// ============================================================

const showWinnerScreen = () => {
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

// ============================================================
//  RESET
// ============================================================

const resetGame = () => {
  clearTimer();
  state = createInitialState();
  document.getElementById('player1-name').value = '';
  document.getElementById('player2-name').value = '';
  renderHighScoresPreview();
  switchScreen('screen-start');
};

// ============================================================
//  BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initStartScreen();
});
