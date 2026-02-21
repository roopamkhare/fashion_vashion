import { state } from '../data/state.js';
import { CATEGORIES, SHOP_ITEMS, PLAYER_EMOJIS } from '../data/constants.js';
import { setText, switchScreen } from '../utils/dom.js';
import { AudioEngine } from '../utils/audio.js';
import { showWinnerScreen } from './winner.js';

export const startBoutiqueRound = (playerIndex) => {
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

const getSpentCoins = (playerIndex) =>
  state.players[playerIndex].selectedItems.reduce((sum, i) => sum + i.price, 0);

const getRemainingCoins = (playerIndex) =>
  state.players[playerIndex].coins - getSpentCoins(playerIndex);

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
