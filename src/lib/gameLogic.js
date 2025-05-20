import { ALL_CARDS, shuffleDeck, is_hap, find_all_haps } from "./cardUtils";

export const DEFAULT_TIMER_DURATION = 30; // seconds for classic mode moves
export const DEFAULT_MAX_ROUNDS = 10;
export const DEFAULT_SOLO_TIME_ATTACK_DURATION = 180; // 3 minutes for solo mode

export const INITIAL_STATE = {
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
  gameMode: "classic", // "classic", "solo_time_attack"

  // Classic Mode State
  player1Score: 0,
  player2Score: 0,
  currentPlayer: 1,
  round: 1,
  timerValue: DEFAULT_TIMER_DURATION, // Per-move timer value
  isTimerRunning: false, // For per-move timer

  // Solo Time Attack Mode State
  soloScore: 0,
  soloTotalTimeValue: DEFAULT_SOLO_TIME_ATTACK_DURATION, // Overall timer for solo mode
  isSoloTimerRunning: false,
};

export const ACTIONS = {
  SET_GAME_MODE: "SET_GAME_MODE",
  SET_GAME_CONFIG: "SET_GAME_CONFIG",
  START_GAME: "START_GAME",
  SELECT_CARD: "SELECT_CARD",
  CALL_GYUL: "CALL_GYUL", // Classic mode Gyul
  // Timer actions (classic mode)
  RESET_TIMER: "RESET_TIMER", 
  DECREMENT_TIMER: "DECREMENT_TIMER",
  TIMER_EXPIRED: "TIMER_EXPIRED",
  STOP_TIMER: "STOP_TIMER",
  // Solo Mode Actions
  DECREMENT_SOLO_TIMER: "DECREMENT_SOLO_TIMER",
  SOLO_TIMER_EXPIRED: "SOLO_TIMER_EXPIRED", // When main game timer for solo runs out
  SOLO_FOUND_HAP: "SOLO_FOUND_HAP",
  SOLO_NO_MORE_HAPS: "SOLO_NO_MORE_HAPS", // When board has no haps and deck is empty

  SET_MESSAGE: "SET_MESSAGE",
};

export function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GAME_MODE:
      return {
        ...INITIAL_STATE, // Reset to defaults when changing mode
        gameMode: action.payload.mode,
        // Carry over general configs if needed, or reset them too
        timerConfig: state.timerConfig, 
        maxRoundsConfig: state.maxRoundsConfig,
        soloTimeAttackDurationConfig: state.soloTimeAttackDurationConfig,
        // Ensure timer values are also reset according to the new mode's defaults
        timerValue: state.timerConfig,
        soloTotalTimeValue: state.soloTimeAttackDurationConfig,
      };

    case ACTIONS.SET_GAME_CONFIG:
      return {
        ...state,
        timerConfig: action.payload.timerDuration !== undefined ? action.payload.timerDuration : state.timerConfig,
        maxRoundsConfig: action.payload.maxRounds !== undefined ? action.payload.maxRounds : state.maxRoundsConfig,
        soloTimeAttackDurationConfig: action.payload.soloTime !== undefined ? action.payload.soloTime : state.soloTimeAttackDurationConfig,
        timerValue: action.payload.timerDuration !== undefined ? action.payload.timerDuration : state.timerConfig,
        soloTotalTimeValue: action.payload.soloTime !== undefined ? action.payload.soloTime : state.soloTimeAttackDurationConfig,
      };

    case ACTIONS.START_GAME:
      {
        const shuffledDeck = shuffleDeck([...ALL_CARDS]);
        const board = shuffledDeck.slice(0, 9);
        const remainingDeck = shuffledDeck.slice(9);
        let startMessage = "";
        let soloTimerRunning = false;
        let classicTimerRunning = false;

        if (state.gameMode === "classic") {
          startMessage = "message_player_1_turn";
          classicTimerRunning = state.timerConfig > 0; // Only run if timer is not OFF
        } else if (state.gameMode === "solo_time_attack") {
          startMessage = "message_solo_start";
          soloTimerRunning = true;
        }

        return {
          ...INITIAL_STATE, // Reset scores, round, etc.
          gameMode: state.gameMode, // Preserve current mode
          timerConfig: state.timerConfig,
          maxRoundsConfig: state.maxRoundsConfig,
          soloTimeAttackDurationConfig: state.soloTimeAttackDurationConfig,
          deck: remainingDeck,
          boardCards: board,
          message: startMessage,
          timerValue: state.timerConfig,
          isTimerRunning: classicTimerRunning,
          soloTotalTimeValue: state.soloTimeAttackDurationConfig,
          isSoloTimerRunning: soloTimerRunning,
        };
      }

    // --- Classic Mode Logic ---
    case ACTIONS.RESET_TIMER: // Classic mode per-move timer
      if (state.gameMode !== "classic" || state.timerConfig === 0) return state;
      return {
        ...state,
        timerValue: state.timerConfig,
        isTimerRunning: true,
      };

    case ACTIONS.STOP_TIMER: // Classic mode per-move timer
      if (state.gameMode !== "classic") return state;
      return {
        ...state,
        isTimerRunning: false,
      };

    case ACTIONS.DECREMENT_TIMER: // Classic mode per-move timer
      if (state.gameMode !== "classic" || !state.isTimerRunning || state.gameOver || state.timerConfig === 0) return state;
      if (state.timerValue > 0) {
        return { ...state, timerValue: state.timerValue - 1 };
      } else {
        // This should trigger TIMER_EXPIRED from component effect
        return { ...state, isTimerRunning: false }; 
      }

    case ACTIONS.TIMER_EXPIRED: // Classic mode per-move timer
      {
        if (state.gameMode !== "classic" || state.timerConfig === 0) return state;
        let newState = { ...state };
        newState.isTimerRunning = false;
        const penalty = -1;
        if (newState.currentPlayer === 1) {
          newState.player1Score += penalty;
        } else {
          newState.player2Score += penalty;
        }
        const expiredPlayer = newState.currentPlayer;
        newState.currentPlayer = newState.currentPlayer === 1 ? 2 : 1;
        newState.message = `message_timer_expired_player_${expiredPlayer}`;
        newState.selectedCards = [];
        if(newState.timerConfig > 0) {
            newState.timerValue = newState.timerConfig;
            newState.isTimerRunning = true;
        }
        return newState;
      }
    case ACTIONS.SELECT_CARD: // Shared by classic, adapted for solo later
      {
        if (state.gameOver) return state;
        if (state.gameMode === "classic" && !state.isTimerRunning && state.timerConfig !== 0) return state;

        const cardId = action.payload.cardId;
        let newSelectedCards = [...state.selectedCards];
        let newState = { ...state };

        if (newSelectedCards.includes(cardId)) {
          newSelectedCards = newSelectedCards.filter((id) => id !== cardId);
        } else if (newSelectedCards.length < 3) {
          newSelectedCards.push(cardId);
        } else {
          return state; // Max 3 selected
        }
        newState.selectedCards = newSelectedCards;

        if (newSelectedCards.length === 3) {
          if (state.gameMode === "classic" && state.timerConfig !== 0) newState.isTimerRunning = false; // Pause per-move timer
          
          const cardsToCheck = newSelectedCards.map((id) =>
            state.boardCards.find((card) => card.id === id)
          );

          if (is_hap(cardsToCheck[0], cardsToCheck[1], cardsToCheck[2])) {
            if (state.gameMode === "classic") {
              const pointsEarned = 1;
              if (newState.currentPlayer === 1) newState.player1Score += pointsEarned;
              else newState.player2Score += pointsEarned;
              newState.message = `message_player_${state.currentPlayer}_found_hap`;
              if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true;
              }
            } else if (state.gameMode === "solo_time_attack") {
              newState.soloScore += 1;
              newState.message = "message_solo_hap_found";
            }
            // Shared logic: replace cards
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

            // Check if no more Haps on board for solo mode
            if (state.gameMode === "solo_time_attack" && find_all_haps(newState.boardCards).length === 0 && newState.deck.length === 0) {
              newState.gameOver = true;
              newState.isSoloTimerRunning = false;
              newState.message = "message_solo_no_more_haps_game_over";
            }

          } else { // Not a Hap
            if (state.gameMode === "classic") {
              const pointsLost = -1;
              if (newState.currentPlayer === 1) newState.player1Score += pointsLost;
              else newState.player2Score += pointsLost;
              const previousPlayer = newState.currentPlayer;
              newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
              newState.message = `message_not_hap_player_${previousPlayer}`;
              if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true;
              }
            } else if (state.gameMode === "solo_time_attack") {
              newState.soloScore -= 1; // Penalty for incorrect selection in solo
              newState.message = "message_solo_not_hap";
            }
            newState.selectedCards = [];
          }
        } else { // Less than 3 cards selected
          if (state.gameMode === "classic") {
            newState.message = `message_player_${state.currentPlayer}_selected_cards`;
          } else if (state.gameMode === "solo_time_attack") {
            newState.message = "message_solo_selected_cards";
          }
        }
        return newState;
      }

    case ACTIONS.CALL_GYUL: // Classic mode Gyul
      {
        if (state.gameMode !== "classic" || state.gameOver) return state;
        if (!state.isTimerRunning && state.timerConfig !== 0) return state; // Check if timer was running
        
        let newState = { ...state };
        if(state.timerConfig !== 0) newState.isTimerRunning = false;

        const remainingHaps = find_all_haps(state.boardCards);

        if (remainingHaps.length === 0) {
          const pointsEarned = 3;
          if (newState.currentPlayer === 1) newState.player1Score += pointsEarned;
          else newState.player2Score += pointsEarned;
          
          newState.message = `message_player_${state.currentPlayer}_gyul_correct`;
          newState.round += 1;

          if (newState.maxRoundsConfig !== 0 && newState.round > newState.maxRoundsConfig) {
            newState.gameOver = true;
            const winner = newState.player1Score > newState.player2Score ? 1 : newState.player2Score > newState.player1Score ? 2 : 0;
            newState.message = winner === 0 ? "message_game_over_draw" : `message_game_over_player_${winner}_wins`;
            newState.isTimerRunning = false; 
          } else {
            const shuffledDeck = shuffleDeck([...ALL_CARDS]);
            newState.boardCards = shuffledDeck.slice(0, 9);
            newState.deck = shuffledDeck.slice(9);
            newState.selectedCards = [];
            newState.currentPlayer = 1;
            newState.message += " message_starting_round";
            if(newState.timerConfig > 0) {
                newState.timerValue = newState.timerConfig;
                newState.isTimerRunning = true;
            }
          }
        } else { // Incorrect Gyul
          const pointsLost = -1;
          if (newState.currentPlayer === 1) newState.player1Score += pointsLost;
          else newState.player2Score += pointsLost;
          const previousPlayer = newState.currentPlayer;
          newState.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
          newState.message = `message_gyul_incorrect_player_${previousPlayer}`;
          newState.selectedCards = [];
          if(newState.timerConfig > 0) {
            newState.timerValue = newState.timerConfig;
            newState.isTimerRunning = true;
          }
        }
        return newState;
      }

    // --- Solo Time Attack Mode Logic ---
    case ACTIONS.DECREMENT_SOLO_TIMER:
      if (state.gameMode !== "solo_time_attack" || !state.isSoloTimerRunning || state.gameOver) return state;
      if (state.soloTotalTimeValue > 0) {
        return { ...state, soloTotalTimeValue: state.soloTotalTimeValue - 1 };
      } else {
        // This should trigger SOLO_TIMER_EXPIRED from component effect
        return { ...state, isSoloTimerRunning: false }; 
      }
    
    case ACTIONS.SOLO_TIMER_EXPIRED:
      if (state.gameMode !== "solo_time_attack") return state;
      return {
        ...state,
        gameOver: true,
        isSoloTimerRunning: false,
        message: "message_solo_time_up_game_over",
      };

    case ACTIONS.SOLO_NO_MORE_HAPS: // Called by component when find_all_haps is 0 and deck is empty
        if (state.gameMode !== "solo_time_attack") return state;
        return {
            ...state,
            gameOver: true,
            isSoloTimerRunning: false,
            message: "message_solo_no_more_haps_game_over",
        };

    case ACTIONS.SET_MESSAGE:
      return { ...state, message: action.payload.message };

    default:
      return state;
  }
}

