export const HighScores = (() => {
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
