export const state = {
  // Network State
  peer: null,
  conn: null, // For client
  connections: [], // For host
  isHost: false,
  roomCode: null,
  myId: null,
  
  // Game Mode: 'fashion' or 'pictionary'
  gameMode: 'fashion',
  
  // Game State
  players: [], // Array of { id, name, score, coins, outfit: [] }
  currentPlayerIndex: 0,
  difficulty: 'grade4', // 'age5' or 'grade4'
  
  // Round State
  currentTheme: null,
  round: 1,
  maxRounds: 3,
  
  // Math State
  mathQuestionsAnswered: 0,
  mathQuestionsTotal: 5,
  currentQuestion: null,
  
  // Timer State  
  timerHandle: null,
  timerSeconds: 0,
  
  // Boutique State
  shopItems: [],
  
  // Pictionary State
  picDrawerIndex: 0,        // index of current drawer in players[]
  picRound: 1,              // which drawing round we're on
  picWord: null,             // the current word to draw
  picGuessedBy: [],          // player IDs who already guessed correctly this turn
  picTurnStartTime: 0,       // Date.now() when drawing started
  picScores: {},             // { playerId: totalPoints }
  picUsedWords: [],          // words already used this game
};

export const resetGameState = () => {
  state.players.forEach(p => {
    p.score = 0;
    p.coins = 0;
    p.outfit = [];
  });
  state.currentPlayerIndex = 0;
  state.round = 1;
  state.mathQuestionsAnswered = 0;
};

export const resetPictionaryState = () => {
  state.picDrawerIndex = 0;
  state.picRound = 1;
  state.picWord = null;
  state.picGuessedBy = [];
  state.picTurnStartTime = 0;
  state.picScores = {};
  state.picUsedWords = [];
  state.players.forEach(p => { state.picScores[p.id] = 0; });
};
