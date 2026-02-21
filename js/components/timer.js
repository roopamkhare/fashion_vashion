import { state } from '../data/state.js';
import { QUESTION_TIME, TIMER_CIRCUMF } from '../data/constants.js';
import { AudioEngine } from '../utils/audio.js';

export const clearTimer = () => {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
};

export const renderTimerRing = (seconds) => {
  const fill = document.getElementById('timer-ring-fill');
  const text = document.getElementById('timer-text');
  if (!fill || !text) return;

  const ratio  = seconds / QUESTION_TIME;
  fill.style.strokeDashoffset = TIMER_CIRCUMF * (1 - ratio);
  fill.classList.toggle('warning', seconds <= 5);
  text.textContent = seconds;
};

export const startTimer = (onExpire) => {
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
