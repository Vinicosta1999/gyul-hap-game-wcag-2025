// /home/ubuntu/gyul_hap_final_project/src/lib/tests/gameLogic.test.js

import { gameReducer, INITIAL_STATE, ACTIONS, DEFAULT_TIMER_DURATION, DEFAULT_MAX_ROUNDS } from "../gameLogic";
import { ALL_CARDS } from "../cardUtils"; // Assuming cardUtils exports this for deck size checks

// Mock i18n t function for tests, as gameLogic now uses message keys
const t = (key, params) => {
  let message = key;
  if (params) {
    Object.keys(params).forEach(pKey => {
      message = message.replace(`{{${pKey}}}`, params[pKey]);
    });
  }
  return message;
};

// Helper to get a specific card for testing selection (if needed, though IDs are simpler)
// const getTestCard = (id) => ALL_CARDS.find(card => card.id === id);

describe("gameReducer", () => {
  let initialState;

  beforeEach(() => {
    // Reset initial state before each test, applying potential default configs
    initialState = {
      ...INITIAL_STATE,
      timerConfig: DEFAULT_TIMER_DURATION,
      maxRoundsConfig: DEFAULT_MAX_ROUNDS,
      timerValue: DEFAULT_TIMER_DURATION,
      message: t("message_player_1_turn") // Initial message based on default turn
    };
  });

  test("should initialize with default state", () => {
    const action = { type: "UNKNOWN_ACTION" }; // Any action not handled by reducer
    const state = gameReducer(initialState, action);
    expect(state.deck).toEqual([]); // Initial state from reducer has empty deck before START_GAME
    expect(state.boardCards).toEqual([]);
    expect(state.player1Score).toBe(0);
    expect(state.round).toBe(1);
    expect(state.gameOver).toBe(false);
    expect(state.timerConfig).toBe(DEFAULT_TIMER_DURATION);
    expect(state.maxRoundsConfig).toBe(DEFAULT_MAX_ROUNDS);
    expect(state.gameMode).toBe("classic");
  });

  test("ACTION.SET_GAME_CONFIG should update timer and rounds configuration", () => {
    const config = { timerDuration: 60, maxRounds: 5 };
    const action = { type: ACTIONS.SET_GAME_CONFIG, payload: config };
    const state = gameReducer(initialState, action);
    expect(state.timerConfig).toBe(60);
    expect(state.maxRoundsConfig).toBe(5);
    expect(state.timerValue).toBe(60); // timerValue should also update to new config
  });

  test("ACTION.START_GAME should set up the game board and deck", () => {
    const action = { type: ACTIONS.START_GAME };
    const state = gameReducer(initialState, action);
    expect(state.boardCards.length).toBe(9);
    expect(state.deck.length).toBe(ALL_CARDS.length - 9);
    expect(state.isTimerRunning).toBe(true);
    expect(state.timerValue).toBe(state.timerConfig);
    expect(state.message).toBe(t("message_player_1_turn"));
    expect(state.gameOver).toBe(false);
    expect(state.round).toBe(1);
    expect(state.player1Score).toBe(0);
    expect(state.player2Score).toBe(0);
  });

  test("ACTION.DECREMENT_TIMER should decrease timerValue by 1", () => {
    let state = gameReducer(initialState, { type: ACTIONS.START_GAME });
    const initialTimerValue = state.timerValue;
    state = gameReducer(state, { type: ACTIONS.DECREMENT_TIMER });
    expect(state.timerValue).toBe(initialTimerValue - 1);
  });

  test("ACTION.DECREMENT_TIMER should not go below 0 and stop timer", () => {
    let state = gameReducer(initialState, { type: ACTIONS.START_GAME });
    state = { ...state, timerValue: 1 }; // Set timer to 1
    state = gameReducer(state, { type: ACTIONS.DECREMENT_TIMER }); // Decrement to 0
    expect(state.timerValue).toBe(0);
    state = gameReducer(state, { type: ACTIONS.DECREMENT_TIMER }); // Try to decrement again
    expect(state.timerValue).toBe(0); // Should stay 0
    expect(state.isTimerRunning).toBe(false); // Timer should be stopped by reducer logic when it hits 0
  });

  test("ACTION.TIMER_EXPIRED should penalize current player and switch turns", () => {
    let state = gameReducer(initialState, { type: ACTIONS.START_GAME });
    const currentPlayer = state.currentPlayer;
    const otherPlayer = currentPlayer === 1 ? 2 : 1;

    state = gameReducer(state, { type: ACTIONS.TIMER_EXPIRED });

    if (currentPlayer === 1) {
      expect(state.player1Score).toBe(-1);
      expect(state.player2Score).toBe(0);
    } else {
      expect(state.player2Score).toBe(-1);
      expect(state.player1Score).toBe(0);
    }
    expect(state.currentPlayer).toBe(otherPlayer);
    expect(state.isTimerRunning).toBe(true); // Timer should restart for next player
    expect(state.timerValue).toBe(state.timerConfig);
    expect(state.message).toBe(t(`message_timer_expired_player_${currentPlayer}` , {expiredPlayer: currentPlayer, penalty: -1, nextPlayer: otherPlayer} ));
  });

  // More tests needed for SELECT_CARD (correct Hap, incorrect Hap)
  // More tests for CALL_GYUL (correct Gyul, incorrect Gyul, game end by rounds)

  describe("ACTION.SELECT_CARD", () => {
    let gameStartedState;
    beforeEach(() => {
      gameStartedState = gameReducer(initialState, { type: ACTIONS.START_GAME });
      // For predictable tests, we might need to mock shuffleDeck or provide a fixed board
      // For now, we assume the board has some cards.
      // Ensure there are cards on the board for selection tests
      if (gameStartedState.boardCards.length < 3) {
        throw new Error("Test setup error: Board needs at least 3 cards for SELECT_CARD tests.");
      }
    });

    test("should select up to 3 cards", () => {
      let state = gameStartedState;
      const card1_id = state.boardCards[0].id;
      const card2_id = state.boardCards[1].id;
      const card3_id = state.boardCards[2].id;

      state = gameReducer(state, { type: ACTIONS.SELECT_CARD, payload: { cardId: card1_id } });
      expect(state.selectedCards).toContain(card1_id);
      expect(state.selectedCards.length).toBe(1);
      expect(state.message).toBe(t(`message_player_${state.currentPlayer}_selected_cards`, {player: state.currentPlayer, count: 1}));

      state = gameReducer(state, { type: ACTIONS.SELECT_CARD, payload: { cardId: card2_id } });
      expect(state.selectedCards).toContain(card2_id);
      expect(state.selectedCards.length).toBe(2);

      state = gameReducer(state, { type: ACTIONS.SELECT_CARD, payload: { cardId: card3_id } });
      expect(state.selectedCards).toContain(card3_id);
      expect(state.selectedCards.length).toBe(3);
      // Message will now be about Hap or not Hap
    });

    test("should deselect a card if clicked again", () => {
      let state = gameStartedState;
      const card1_id = state.boardCards[0].id;
      state = gameReducer(state, { type: ACTIONS.SELECT_CARD, payload: { cardId: card1_id } });
      expect(state.selectedCards).toContain(card1_id);
      state = gameReducer(state, { type: ACTIONS.SELECT_CARD, payload: { cardId: card1_id } });
      expect(state.selectedCards).not.toContain(card1_id);
      expect(state.selectedCards.length).toBe(0);
    });

    // Test for correct Hap and incorrect Hap requires a board where we know a Hap exists or doesn't.
    // This might involve mocking cardUtils.is_hap or setting up a specific board state.
  });

  describe("ACTION.CALL_GYUL", () => {
    let gameStartedState;
    beforeEach(() => {
      gameStartedState = gameReducer(initialState, { type: ACTIONS.START_GAME });
    });

    // Test for correct Gyul (no Haps on board)
    // This requires mocking find_all_haps or setting a board with no Haps.

    // Test for incorrect Gyul (Haps on board)
    // This requires mocking find_all_haps or setting a board with Haps.

    test("should end game if max rounds reached after correct Gyul", () => {
      let state = { 
        ...gameStartedState,
        round: DEFAULT_MAX_ROUNDS, // Set to last round
        maxRoundsConfig: DEFAULT_MAX_ROUNDS,
        boardCards: [ // Provide a board with no Haps for a correct Gyul call
          { id: 1, shape: "circle", color: "red", fill: "solid", count: 1 },
          { id: 2, shape: "circle", color: "blue", fill: "solid", count: 2 },
          { id: 3, shape: "square", color: "green", fill: "solid", count: 3 },
          // Add more cards to make it 9, ensuring no Haps among them
          { id: 4, shape: "triangle", color: "red", fill: "striped", count: 1 },
          { id: 5, shape: "triangle", color: "blue", fill: "striped", count: 2 },
          { id: 6, shape: "square", color: "green", fill: "striped", count: 3 },
          { id: 7, shape: "circle", color: "red", fill: "empty", count: 1 },
          { id: 8, shape: "circle", color: "blue", fill: "empty", count: 2 },
          { id: 9, shape: "square", color: "green", fill: "empty", count: 3 },
        ]
      };
      // Mock find_all_haps to return empty array for this specific test case
      const originalFindAllHaps = jest.requireActual("../cardUtils").find_all_haps;
      const mockFindAllHaps = jest.fn(() => []);
      jest.mock("../cardUtils", () => ({
        ...jest.requireActual("../cardUtils"),
        find_all_haps: mockFindAllHaps,
      }));

      state = gameReducer(state, { type: ACTIONS.CALL_GYUL });
      expect(state.gameOver).toBe(true);
      expect(state.message).not.toContain("message_starting_round"); // Should be a game over message
      // Restore original module
      jest.unmock("../cardUtils");
      jest.requireActual("../cardUtils").find_all_haps = originalFindAllHaps;
    });
  });

  test("ACTION.SET_MESSAGE should update the message state", () => {
    const newMessage = "Test message for SET_MESSAGE";
    const action = { type: ACTIONS.SET_MESSAGE, payload: { message: newMessage } };
    const state = gameReducer(initialState, action);
    expect(state.message).toBe(newMessage);
  });

});

// Note: For tests involving is_hap and find_all_haps,
// you might need to:
// 1. Provide specific board setups where Haps are known to exist or not.
// 2. Mock these functions from cardUtils.js to control their return values for specific tests.
//    e.g., jest.mock("../cardUtils", () => ({
//      ...jest.requireActual("../cardUtils"), // Preserve other exports
//      is_hap: jest.fn(() => true), // Mock is_hap to always return true for a test
//      find_all_haps: jest.fn(() => []), // Mock find_all_haps to return no haps
//    }));
// Remember to unmock or clear mocks between tests if they interfere.

