import { state } from '../data/state.js';
import { showScreen } from './start.js';
import { AudioEngine } from '../utils/audio.js';
import { sendToHost } from '../utils/network.js';
import { SHOP_ITEMS } from '../data/constants.js';

export const startBoutique = () => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (currentPlayer.id === state.myId) {
    showScreen('screen-boutique');
    updateBoutiqueUI();
  } else {
    showScreen('screen-waiting');
    const waitingList = document.getElementById('waiting-player-list');
    waitingList.innerHTML = `<li><span>${currentPlayer.name}</span><span>is shopping...</span></li>`;
  }
};

const updateBoutiqueUI = () => {
  const player = state.players[state.currentPlayerIndex];
  document.getElementById('boutique-player-name').textContent = player.name;
  document.getElementById('budget-coins').textContent = `🪙 ${player.coins}`;
  document.getElementById('boutique-theme-mini').textContent = state.currentTheme.name;
  
  const categories = ['dress', 'shoes', 'bag', 'accessory'];
  const container = document.getElementById('shop-categories');
  container.innerHTML = '';
  
  categories.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'shop-category';
    catDiv.innerHTML = `<h3>${cat.toUpperCase()}</h3>`;
    
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'shop-items';
    
    SHOP_ITEMS.filter(i => i.category === cat).forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'shop-item';
      
      const isSelected = player.outfit.some(o => o.id === item.id);
      const canAfford = player.coins >= item.price;
      
      if (isSelected) btn.classList.add('selected');
      if (!canAfford && !isSelected) btn.classList.add('cant-afford');
      
      btn.innerHTML = `
        <span class="item-emoji">${item.emoji}</span>
        <div class="item-name">${item.name}</div>
        <div class="item-price">🪙 ${item.price}</div>
        <div class="item-tags">
          ${item.tags.map(t => `<span class="item-tag ${state.currentTheme.tags.includes(t) ? 'match' : ''}">${t}</span>`).join('')}
        </div>
      `;
      
      btn.onclick = () => handlePurchase(item, btn);
      itemsDiv.appendChild(btn);
    });
    
    catDiv.appendChild(itemsDiv);
    container.appendChild(catDiv);
  });
  
  updateOutfitSlots();
  
  const doneBtn = document.getElementById('btn-boutique-done');
  doneBtn.onclick = finishShopping;
};

const handlePurchase = (item, btn) => {
  const player = state.players[state.currentPlayerIndex];
  const existingIndex = player.outfit.findIndex(o => o.category === item.category);
  
  if (existingIndex > -1) {
    // Sell back
    const existing = player.outfit[existingIndex];
    player.coins += existing.price;
    player.outfit.splice(existingIndex, 1);
    AudioEngine.deselect();
  }
  
  if (!player.outfit.some(o => o.id === item.id) && player.coins >= item.price) {
    // Buy
    player.coins -= item.price;
    player.outfit.push(item);
    AudioEngine.select();
  }
  
  updateBoutiqueUI();
};

const updateOutfitSlots = () => {
  const player = state.players[state.currentPlayerIndex];
  const slots = ['dress', 'shoes', 'bag', 'accessory'];
  const container = document.getElementById('outfit-slots');
  container.innerHTML = '';
  
  slots.forEach(slot => {
    const item = player.outfit.find(o => o.category === slot);
    const div = document.createElement('div');
    div.className = `outfit-slot ${item ? 'filled' : ''}`;
    
    if (item) {
      div.innerHTML = `
        <span class="outfit-slot-emoji">${item.emoji}</span>
        <span class="outfit-slot-name">${item.name}</span>
      `;
    } else {
      div.innerHTML = `<span>${slot}</span>`;
    }
    
    container.appendChild(div);
  });
};

export const finishShopping = () => {
  const player = state.players[state.currentPlayerIndex];
  
  // Calculate score
  let score = 0;
  player.outfit.forEach(item => {
    item.tags.forEach(tag => {
      if (state.currentTheme.tags.includes(tag)) {
        score += 10;
      }
    });
  });
  
  player.score += score;
  
  sendToHost({ type: 'BOUTIQUE_COMPLETE', playerId: state.myId, outfit: player.outfit, score: player.score });
};

// Attach to global for HTML button
window.finishShopping = finishShopping;
