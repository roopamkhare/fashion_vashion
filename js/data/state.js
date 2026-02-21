export const state = {
  // Network State
  peer: null,
  conn: null, // For client
  connections: [], // For host
  isHost: false,
  roomCode: null,
  myId: null,
  
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
  shopItems: []
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
