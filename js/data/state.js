import { QUESTION_TIME } from './constants.js';

export const createPlayer = (name) => ({
  name,
  coins:        0,
  correctCount: 0,
  selectedItems:[],   // array of item objects chosen in boutique
  styleScore:   0,
  mathScore:    0,
  budgetBonus:  0,
  totalScore:   0,
});

export const createInitialState = () => ({
  players:             [createPlayer('Player 1'), createPlayer('Player 2')],
  theme:               null,
  currentMathPlayer:   0,
  currentBoutiquePlayer: 0,
  currentQuestion:     null,
  questionIndex:       0,
  timerHandle:         null,
  timerSeconds:        QUESTION_TIME,
});

export let state = createInitialState();

export const resetState = () => {
  state = createInitialState();
};
