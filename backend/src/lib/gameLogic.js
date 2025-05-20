const { ALL_CARDS, shuffleDeck, is_hap, find_all_haps } = require("./cardUtils");

const DEFAULT_TIMER_DURATION = 30; // seconds for classic mode moves
const DEFAULT_MAX_ROUNDS = 10;
const DEFAULT_SOLO_TIME_ATTACK_DURATION = 180; // 3 minutes for solo mode

const INITIAL_STATE = {
  // Shared state
  deck: [],
  boardCards: [],
  selectedCards: [],
  gameOver: false,
  message: "", // i18n key
  
  // Configurable settings (persisted)
  timerConfig: DEFAULT_TIMER_DURATION, // Per-move timer for classic
  maxRoundsConfig: DEFAULT_MAX_ROUNDS, // For classic mode
  soloTimeAttackDurationConfig: DEFAULT_SOLO_TIME_ATTACK_DURATION, // Total time for solo mode
  gameMode: "classic", // "classic", "solo_time_attack", "multiplayer_classic"

  // Classic Mode State (also base for multiplayer)
  player1Score: 0,
  player2Score: 0,
  currentPlayer: 1, // In multiplayer, this could be player ID or socket ID
  round: 1,
  timerValue: DEFAULT_TIMER_DURATION, // Per-move timer value
  isTimerRunning: false, // For per-move timer

  // Solo Time Attack Mode State
  soloScore: 0,
  soloTotalTimeValue: DEFAULT_SOLO_TIME_ATTACK_DURATION, // Overall timer for solo mode
  isSoloTimerRunning: false,
};

const ACTIONS = {
  SET_GAME_MODE: "SET_GAME_MODE",
  SET_GAME_CONFIG: "SET_GAME_CONFIG",
  START_GAME: "START_GAME",
  SELECT_CARD: "SELECT_CARD",
  CALL_GYUL: "CALL_GYUL", 
  RESET_TIMER: "RESET_TIMER", 
  DECREMENT_TIMER: "DECREMENT_TIMER",
  TIMER_EXPIRED: "TIMER_EXPIRED",
  STOP_TIMER: "STOP_TIMER",
  DECREMENT_SOLO_TIMER: "DECREMENT_SOLO_TIMER",
  SOLO_TIMER_EXPIRED: "SOLO_TIMER_EXPIRED",
  SOLO_FOUND_HAP: "SOLO_FOUND_HAP", // Not directly used in reducer, but as a conceptual action
  SOLO_NO_MORE_HAPS: "SOLO_NO_MORE_HAPS",
  SET_MESSAGE: "SET_MESSAGE",
  // Multiplayer specific actions (can be handled by server logic directly or via reducer)
  PLAYER_JOINED_GAME: "PLAYER_JOINED_GAME",
  PLAYER_LEFT_GAME: "PLAYER_LEFT_GAME",
  SET_CURRENT_PLAYER: "SET_CURRENT_PLAYER",
  UPDATE_SCORES: "UPDATE_SCORES",
};

function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GAME_MODE:
      return {
        ...INITIAL_STATE,
        gameMode: action.payload.mode,
        timerConfig: state.timerConfig, 
        maxRoundsConfig: state.maxRoundsConfig,
        soloTimeAttackDurationConfig: state.soloTimeAttackDurationConfig,
        timerValue: state.timerConfig,
        soloTotalTimeValue: state.soloTimeAttackDurationConfig,
      };

    case ACTIONS.SET_GAME_CONFIG: // For server-side, this might be set when a room is created
      return {
        ...state,
        timerConfig: action.payload.timerDuration !== undefined ? action.payload.timerDuration : state.timerConfig,
        maxRoundsConfig: action.payload.maxRounds !== undefined ? action.payload.maxRounds : state.maxRoundsConfig,
        // soloTimeAttackDurationConfig: action.payload.soloTime !== undefined ? action.payload.soloTime : state.soloTimeAttackDurationConfig, // Less relevant for multiplayer focus
        timerValue: action.payload.timerDuration !== undefined ? action.payload.timerDuration : state.timerConfig,
        // soloTotalTimeValue: action.payload.soloTime !== undefined ? action.payload.soloTime : state.soloTimeAttackDurationConfig,
      };

    case ACTIONS.START_GAME: // Server will typically call this when a room is ready
      {
        const cardSetKey = action.payload && action.payload.cardSetKey ? action.payload.cardSetKey : "default";
        const currentCardSet = CARD_SETS[cardSetKey] || CARD_SETS.default;
        updateCardSet(currentCardSet.shapes, currentCardSet.colors, currentCardSet.bgColors);

        const shuffledDeck = shuffleDeck([...ALL_CARDS], action.payload ? action.payload.seed : undefined);
        const board = shuffledDeck.slice(0, 9);
        const remainingDeck = shuffledDeck.slice(9);
        
        let initialStateForMode = {
            ...INITIAL_STATE,
            gameMode: state.gameMode, // Preserve current mode from room settings
            timerConfig: state.timerConfig,
            maxRoundsConfig: state.maxRoundsConfig,
            deck: remainingDeck,
            boardCards: board,
            timerValue: state.timerConfig,
            // Multiplayer specific initializations
            players: action.payload.players || [], // [{id, username, score: 0}, ...]
            currentPlayerId: action.payload.players && action.payload.players.length > 0 ? action.payload.players[0].id : null,
        };

        if (state.gameMode === "multiplayer_classic") {
            initialStateForMode.message = `message_player_turn_${initialStateForMode.currentPlayerId}`;
            initialStateForMode.isTimerRunning = state.timerConfig > 0;
        } 
        // Add other modes if necessary (e.g., solo)

        return initialStateForMode;
      }

    case ACTIONS.RESET_TIMER: 
      if (state.gameMode !== "multiplayer_classic" || state.timerConfig === 0) return state;
      return {
        ...state,
        timerValue: state.timerConfig,
        isTimerRunning: true,
      };

    case ACTIONS.STOP_TIMER: 
      if (state.gameMode !== "multiplayer_classic") return state;
      return {
        ...state,
        isTimerRunning: false,
      };

    case ACTIONS.DECREMENT_TIMER: 
      if (state.gameMode !== "multiplayer_classic" || !state.isTimerRunning || state.gameOver || state.timerConfig === 0) return state;
      if (state.timerValue > 0) {
        return { ...state, timerValue: state.timerValue - 1 };
      } else {
        return { ...state, isTimerRunning: false }; // Server will dispatch TIMER_EXPIRED
      }

    case ACTIONS.TIMER_EXPIRED: 
      {
        if (state.gameMode !== "multiplayer_classic" || state.timerConfig === 0) return state;
        let newState = { ...state };
        newState.isTimerRunning = false;
        const penalty = -1;
        
        const offendingPlayerIndex = newState.players.findIndex(p => p.id === newState.currentPlayerId);
        if (offendingPlayerIndex !== -1) {
            newState.players[offendingPlayerIndex].score += penalty;
        }

        const currentTurnPlayerId = newState.currentPlayerId;
        // Switch to the next player (assuming 2 players for now, needs robust cycling for N players)
        const playerIds = newState.players.map(p => p.id);
        const currentPlayerIdx = playerIds.indexOf(currentTurnPlayerId);
        const nextPlayerIdx = (currentPlayerIdx + 1) % playerIds.length;
        newState.currentPlayerId = playerIds[nextPlayerIdx];
        
        newState.message = `message_timer_expired_player_${currentTurnPlayerId}`;
        newState.selectedCards = [];
        if(newState.timerConfig > 0) {
            newState.timerValue = newState.timerConfig;
            newState.isTimerRunning = true;
        }
        return newState;
      }

    case ACTIONS.SELECT_CARD: 
      {
        if (state.gameOver) return state;
        // For multiplayer, server validates if it's the player's turn before processing this action.
        // if (state.gameMode === "multiplayer_classic" && action.payload.playerId !== state.currentPlayerId) return state; 
        if (state.gameMode === "multiplayer_classic" && !state.isTimerRunning && state.timerConfig !== 0) return state; // Or allow selection even if timer paused, server decides

        const cardId = action.payload.cardId;
        let newSelectedCards = [...state.selectedCards];
        let newState = { ...state };

        if (newSelectedCards.includes(cardId)) {
          newSelectedCards = newSelectedCards.filter((id) => id !== cardId);
        } else if (newSelectedCards.length < 3) {
          newSelectedCards.push(cardId);
        } else {
          return state; 
        }
        newState.selectedCards = newSelectedCards;

        if (newSelectedCards.length === 3) {
          if (state.gameMode === "multiplayer_classic" && state.timerConfig !== 0) newState.isTimerRunning = false;
          
          const cardsToCheck = newSelectedCards.map((id) =>
            state.boardCards.find((card) => card.id === id)
          );

          if (is_hap(cardsToCheck[0], cardsToCheck[1], cardsToCheck[2])) {
            const pointsEarned = 1;
            const actingPlayerId = action.payload.playerId; // Sent by client
            const playerIndex = newState.players.findIndex(p => p.id === actingPlayerId);
            if (playerIndex !== -1) {
                newState.players[playerIndex].score += pointsEarned;
            }
            newState.message = `message_player_found_hap_${actingPlayerId}`;
            // In multiplayer, the current player might not change immediately, server decides turn logic
            // newState.currentPlayerId remains for now, or server sets next turn.
            if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true; // Timer resets for the current/next player
            }
            
            let currentDeck = [...newState.deck];
            let currentBoard = [...newState.boardCards];
            const newBoardCards = [];
            for (const boardCard of currentBoard) {
              if (newSelectedCards.includes(boardCard.id)) {
                if (currentDeck.length > 0) newBoardCards.push(currentDeck.shift());
              } else {
                newBoardCards.push(boardCard);
              }
            }
            while (newBoardCards.length < 9 && currentDeck.length > 0) {
              newBoardCards.push(currentDeck.shift());
            }
            newState.boardCards = newBoardCards;
            newState.deck = currentDeck;
            newState.selectedCards = [];

            // Check for game end condition (no more haps and empty deck)
            if (find_all_haps(newState.boardCards).length === 0 && newState.deck.length === 0) {
              newState.gameOver = true;
              newState.isTimerRunning = false;
              // Determine winner based on scores
              let winnerMessage = "message_game_over_draw";
              if (newState.players.length === 2) { // Simple 2 player case
                  if (newState.players[0].score > newState.players[1].score) winnerMessage = `message_game_over_player_wins_${newState.players[0].id}`;
                  else if (newState.players[1].score > newState.players[0].score) winnerMessage = `message_game_over_player_wins_${newState.players[1].id}`;
              } // More complex for N players
              newState.message = winnerMessage;
            }

          } else { // Not a Hap
            const pointsLost = -1;
            const actingPlayerId = action.payload.playerId;
            const playerIndex = newState.players.findIndex(p => p.id === actingPlayerId);
            if (playerIndex !== -1) {
                newState.players[playerIndex].score += pointsLost;
            }
            
            const previousPlayerId = actingPlayerId;
            // Switch to the next player
            const playerIds = newState.players.map(p => p.id);
            const currentPlayerIdx = playerIds.indexOf(previousPlayerId);
            const nextPlayerIdx = (currentPlayerIdx + 1) % playerIds.length;
            newState.currentPlayerId = playerIds[nextPlayerIdx];

            newState.message = `message_not_hap_player_${previousPlayerId}`;
            newState.selectedCards = [];
            if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true;
            }
          }
        } else { 
          newState.message = `message_player_selected_cards_${action.payload.playerId}`;
        }
        return newState;
      }

    case ACTIONS.CALL_GYUL: 
      {
        if (state.gameMode !== "multiplayer_classic" || state.gameOver) return state;
        // Server validates if it's the player's turn.
        // if (action.payload.playerId !== state.currentPlayerId) return state;
        if (!state.isTimerRunning && state.timerConfig !== 0) return state; 
        
        let newState = { ...state };
        if(state.timerConfig !== 0) newState.isTimerRunning = false;

        const remainingHaps = find_all_haps(state.boardCards);
        const callingPlayerId = action.payload.playerId;
        const playerIndex = newState.players.findIndex(p => p.id === callingPlayerId);

        if (remainingHaps.length === 0) { // Correct Gyul
          const pointsEarned = 3;
          if (playerIndex !== -1) newState.players[playerIndex].score += pointsEarned;
          
          newState.message = `message_player_gyul_correct_${callingPlayerId}`;
          newState.round += 1;

          if (newState.maxRoundsConfig !== 0 && newState.round > newState.maxRoundsConfig) {
            newState.gameOver = true;
            let winnerMessage = "message_game_over_draw";
            // Simplified winner logic for 2 players
            if (newState.players.length === 2) {
                if (newState.players[0].score > newState.players[1].score) winnerMessage = `message_game_over_player_wins_${newState.players[0].id}`;
                else if (newState.players[1].score > newState.players[0].score) winnerMessage = `message_game_over_player_wins_${newState.players[1].id}`;
            }
            newState.message = winnerMessage;
            newState.isTimerRunning = false; 
          } else {
            // Start new round
            const cardSetKey = action.payload && action.payload.cardSetKey ? action.payload.cardSetKey : "default"; // Or get from room config
            const currentCardSet = CARD_SETS[cardSetKey] || CARD_SETS.default;
            updateCardSet(currentCardSet.shapes, currentCardSet.colors, currentCardSet.bgColors);
            const shuffledDeck = shuffleDeck([...ALL_CARDS], action.payload ? action.payload.seed : undefined); // Use a new seed for new round or room seed
            
            newState.boardCards = shuffledDeck.slice(0, 9);
            newState.deck = shuffledDeck.slice(9);
            newState.selectedCards = [];
            // Reset currentPlayerId to the first player in the room or a defined starting player for the new round
            newState.currentPlayerId = newState.players.length > 0 ? newState.players[0].id : null;
            newState.message += " message_starting_round";
            if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true;
            }
          }
        } else { // Incorrect Gyul
          const pointsLost = -1;
          if (playerIndex !== -1) newState.players[playerIndex].score += pointsLost;
          
          const previousPlayerId = callingPlayerId;
          // Switch to the next player
          const playerIds = newState.players.map(p => p.id);
          const currentPlayerIdx = playerIds.indexOf(previousPlayerId);
          const nextPlayerIdx = (currentPlayerIdx + 1) % playerIds.length;
          newState.currentPlayerId = playerIds[nextPlayerIdx];

          newState.message = `message_gyul_incorrect_player_${previousPlayerId}`;
          newState.selectedCards = [];
          if(newState.timerConfig > 0) {
            newState.timerValue = newState.timerConfig;
            newState.isTimerRunning = true;
          }
        }
        return newState;
      }

    case ACTIONS.SET_MESSAGE:
      return { ...state, message: action.payload.message };

    default:
      return state;
  }
}

module.exports = {
    DEFAULT_TIMER_DURATION,
    DEFAULT_MAX_ROUNDS,
    DEFAULT_SOLO_TIME_ATTACK_DURATION,
    INITIAL_STATE,
    ACTIONS,
    gameReducer,
};
