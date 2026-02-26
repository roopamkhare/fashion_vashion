import { state } from '../data/state.js';
import { THEMES } from '../data/constants.js';
import { updateLobbyUI, showScreen } from '../screens/start.js';
import { startThemeReveal } from '../screens/theme.js';
import { startMathRound } from '../screens/math.js';
import { startBoutique } from '../screens/boutique.js';
import { showWinner } from '../screens/winner.js';
import {
  handleTurnStart, handleDrawData, handleClearCanvas, handleUndo,
  processGuess, handleCorrectGuess, handleTurnEnd,
  showPictionaryWinner, addChatMessage, updateHint, stopTurnTimer
} from '../screens/pictionary.js';

// Initialize PeerJS
export const initPeer = (onOpen, requestedId = null) => {
  state.peer = requestedId ? new Peer(requestedId) : new Peer();
  
  state.peer.on('open', (id) => {
    state.myId = id;
    if (onOpen) onOpen(id);
  });

  state.peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    if (err.type === 'unavailable-id') {
      // If requested ID is taken, try again with a new random one
      alert('Room code already in use. Trying another one...');
      initPeer(onOpen, generateRoomCode());
    } else if (err.type === 'peer-unavailable') {
      alert('Room not found! Check the code and try again.');
      showScreen('screen-start');
    }
  });

  state.peer.on('connection', (conn) => {
    if (!state.isHost) return; // Only host accepts connections
    
    conn.on('data', (data) => handleNetworkData(data, conn));
    conn.on('open', () => {
      state.connections.push(conn);
      // Send current lobby state to new player
      broadcast({ type: 'LOBBY_UPDATE', players: state.players });
    });
    conn.on('close', () => {
      state.connections = state.connections.filter(c => c !== conn);
      // Handle player disconnect
    });
  });
};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RBB-${code}`; // Prefix to avoid collisions on public PeerJS server
};

// Host creates a room
export const createRoom = (playerName, difficulty) => {
  state.isHost = true;
  state.difficulty = difficulty;
  state.roomCode = state.myId.replace('RBB-', ''); // Show short code to users
  
  state.players = [{
    id: state.myId,
    name: playerName,
    score: 0,
    coins: 0,
    outfit: []
  }];
  
  updateLobbyUI();
};

// Client joins a room
export const joinRoom = (roomCode, playerName) => {
  state.isHost = false;
  state.roomCode = roomCode.toUpperCase();
  
  const hostId = `RBB-${state.roomCode}`; 
  
  state.conn = state.peer.connect(hostId);
  
  state.conn.on('open', () => {
    // Send join request
    state.conn.send({ type: 'JOIN', name: playerName, id: state.myId });
    showScreen('screen-waiting');
  });
  
  state.conn.on('data', handleNetworkData);
};

// Broadcast data to all clients (Host only)
export const broadcast = (data) => {
  if (!state.isHost) return;
  state.connections.forEach(conn => conn.send(data));
};

// Send data to host (Client only)
export const sendToHost = (data) => {
  if (state.isHost) {
    // If host sends to host, just handle it directly
    handleNetworkData(data);
  } else if (state.conn) {
    state.conn.send(data);
  }
};

// Handle incoming network data
const handleNetworkData = (data, conn = null) => {
  switch (data.type) {
    case 'JOIN':
      if (state.isHost) {
        state.players.push({
          id: data.id,
          name: data.name,
          score: 0,
          coins: 0,
          outfit: []
        });
        broadcast({ type: 'LOBBY_UPDATE', players: state.players, difficulty: state.difficulty });
        updateLobbyUI();
      }
      break;
      
    case 'LOBBY_UPDATE':
      if (!state.isHost) {
        state.players = data.players;
        if (data.difficulty) state.difficulty = data.difficulty;
        updateLobbyUI();
        showScreen('screen-lobby');
      }
      break;
      
    case 'START_GAME':
      state.players = data.players;
      state.difficulty = data.difficulty;
      state.currentTheme = data.theme;   // Sync theme to ALL clients
      startThemeReveal(data.theme);
      break;
      
    case 'START_MATH':
      state.currentPlayerIndex = data.playerIndex;
      startMathRound();
      break;
      
    case 'MATH_COMPLETE':
      if (state.isHost) {
        // Update player coins
        const player = state.players.find(p => p.id === data.playerId);
        if (player) player.coins = data.coins;
        
        // Move to next player or boutique
        state.currentPlayerIndex++;
        if (state.currentPlayerIndex >= state.players.length) {
          state.currentPlayerIndex = 0;
          broadcast({ type: 'START_BOUTIQUE', players: state.players });
          startBoutique();
        } else {
          broadcast({ type: 'START_MATH', playerIndex: state.currentPlayerIndex });
          startMathRound();
        }
      }
      break;
      
    case 'START_BOUTIQUE':
      state.players = data.players;
      state.currentPlayerIndex = 0;
      startBoutique();
      break;
      
    case 'BOUTIQUE_COMPLETE':
      if (state.isHost) {
        const player = state.players.find(p => p.id === data.playerId);
        if (player) {
          player.outfit = data.outfit;
          player.score = data.score;
        }
        
        state.currentPlayerIndex++;
        if (state.currentPlayerIndex >= state.players.length) {
          // Round over
          state.round++;
          if (state.round > state.maxRounds) {
            broadcast({ type: 'GAME_OVER', players: state.players });
            showWinner();
          } else {
            // Next round
            const nextTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
            state.currentTheme = nextTheme;
            broadcast({ type: 'START_GAME', players: state.players, theme: nextTheme, difficulty: state.difficulty });
            startThemeReveal(nextTheme);
          }
        } else {
          broadcast({ type: 'NEXT_BOUTIQUE_PLAYER', playerIndex: state.currentPlayerIndex });
          startBoutique();
        }
      }
      break;
      
    case 'NEXT_BOUTIQUE_PLAYER':
      state.currentPlayerIndex = data.playerIndex;
      startBoutique();
      break;
      
    case 'GAME_OVER':
      state.players = data.players;
      showWinner();
      break;

    // ── Pictionary messages ──────────────────────────────
    case 'PIC_START_GAME':
      state.gameMode = 'pictionary';
      state.players = data.players;
      state.difficulty = data.difficulty || state.difficulty;
      // Only host calls startNextTurn via startPictionaryGame; clients wait for TURN_START
      break;

    case 'PIC_TURN_START':
      handleTurnStart(data);
      break;

    case 'PIC_DRAW':
      if (state.isHost) {
        // Relay draw data to all OTHER clients
        state.connections.forEach(conn => conn.send(data));
      }
      handleDrawData(data);
      break;

    case 'PIC_CLEAR':
      if (state.isHost) {
        state.connections.forEach(conn => conn.send(data));
      }
      handleClearCanvas();
      break;

    case 'PIC_UNDO':
      if (state.isHost) {
        state.connections.forEach(conn => conn.send(data));
      }
      handleUndo(data);
      break;

    case 'PIC_GUESS':
      if (state.isHost) {
        processGuess(data);
      }
      break;

    case 'PIC_CORRECT':
      handleCorrectGuess(data);
      break;

    case 'PIC_CHAT':
      addChatMessage(data.playerName, data.text, data.close ? 'close-msg' : '');
      break;

    case 'PIC_HINT':
      updateHint(data.hint);
      break;

    case 'PIC_TURN_END':
      handleTurnEnd(data);
      break;

    case 'PIC_GAME_OVER':
      showPictionaryWinner(data);
      break;
  }
};
