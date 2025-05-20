import React, { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import Board from "./Board";
import PlayerPanel from "./PlayerPanel";
import TutorialModal from "./TutorialModal";
import LeaderboardModal from "./LeaderboardModal";
import { 
    gameReducer, INITIAL_STATE, ACTIONS, 
    DEFAULT_TIMER_DURATION, DEFAULT_MAX_ROUNDS, DEFAULT_SOLO_TIME_ATTACK_DURATION 
} from "../lib/gameLogic";
import { useSound } from "../lib/useSound";
import { find_all_haps, CARD_SETS, updateCardSet, getDailySeed } from "../lib/cardUtils"; // Added getDailySeed

const MAX_LEADERBOARD_ENTRIES = 10;
const LEADERBOARD_STORAGE_KEY = "gyulhapLeaderboard";
const CARD_SET_STORAGE_KEY = "gyulhapCardSet";
const DAILY_CHALLENGE_COMPLETED_KEY_PREFIX = "gyulhapDailyChallengeCompleted_";

const Game = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const getDailyChallengeCompletedKey = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${DAILY_CHALLENGE_COMPLETED_KEY_PREFIX}${today}`;
  };

  const initialGameConfig = useCallback(() => {
    const storedCardSetKey = localStorage.getItem(CARD_SET_STORAGE_KEY) || "default";
    const initialCardSet = CARD_SETS[storedCardSetKey] || CARD_SETS.default;
    updateCardSet(initialCardSet.shapes, initialCardSet.colors, initialCardSet.bgColors);

    const baseState = {
        ...INITIAL_STATE,
        timerConfig: parseInt(localStorage.getItem("gyulhapTimerConfigClassic") || DEFAULT_TIMER_DURATION.toString(), 10),
        maxRoundsConfig: parseInt(localStorage.getItem("gyulhapMaxRoundsConfig") || DEFAULT_MAX_ROUNDS.toString(), 10),
        soloTimeAttackDurationConfig: parseInt(localStorage.getItem("gyulhapTimerConfigSolo") || DEFAULT_SOLO_TIME_ATTACK_DURATION.toString(), 10),
        gameMode: localStorage.getItem("gyulhapGameMode") || "classic",
        cardSetConfig: initialCardSet,
    };
    baseState.timerValue = baseState.timerConfig; 
    baseState.soloTotalTimeValue = baseState.soloTimeAttackDurationConfig;
    baseState.message = t("message_player_1_turn"); 
    return baseState;
  }, [t]);

  const [state, dispatch] = useReducer(gameReducer, initialGameConfig());
  const { playSound, toggleMute, isMuted, playMusic, stopMusic, isMusicPlaying, toggleMusic, musicTracks } = useSound();
  
  const classicTimerRef = useRef(null);
  const soloTimerRef = useRef(null);

  const [showSettings, setShowSettings] = useState(true);
  const [selectedGameMode, setSelectedGameMode] = useState(state.gameMode);
  const [selectedTimerDurationClassic, setSelectedTimerDurationClassic] = useState(state.timerConfig);
  const [selectedMaxRounds, setSelectedMaxRounds] = useState(state.maxRoundsConfig);
  const [selectedSoloTime, setSelectedSoloTime] = useState(state.soloTimeAttackDurationConfig);
  const [selectedCardSetKey, setSelectedCardSetKey] = useState(localStorage.getItem(CARD_SET_STORAGE_KEY) || "default");
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language.split("-")[0]);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardScores, setLeaderboardScores] = useState([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerNameForLeaderboard, setPlayerNameForLeaderboard] = useState("");

  useEffect(() => {
    setDailyChallengeCompleted(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");
  }, []); // Check on mount

  useEffect(() => {
    const storedScores = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (storedScores) {
      setLeaderboardScores(JSON.parse(storedScores));
    }
  }, []);

  const saveLeaderboardScores = (scores) => {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
    setLeaderboardScores(scores);
  };

  const addScoreToLeaderboard = (name, score, mode) => {
    const newScore = { name, score, date: new Date().toISOString(), mode };
    const updatedScores = [...leaderboardScores, newScore]
      .sort((a, b) => b.score - a.score) // Simple sort, could be mode-specific
      .slice(0, MAX_LEADERBOARD_ENTRIES);
    saveLeaderboardScores(updatedScores);
  };

  const handleClearLeaderboard = () => {
    saveLeaderboardScores([]);
  };

  useEffect(() => {
    if (state.gameMode === "classic" && state.isTimerRunning && !state.gameOver && state.timerConfig > 0) {
      if (classicTimerRef.current) clearInterval(classicTimerRef.current);
      classicTimerRef.current = setInterval(() => {
        dispatch({ type: ACTIONS.DECREMENT_TIMER });
      }, 1000);
    } else {
      if (classicTimerRef.current) clearInterval(classicTimerRef.current);
    }
    return () => {
      if (classicTimerRef.current) clearInterval(classicTimerRef.current);
    };
  }, [state.gameMode, state.isTimerRunning, state.gameOver, state.timerConfig, state.currentPlayer, state.round]);

  useEffect(() => {
    if ((state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && state.isSoloTimerRunning && !state.gameOver) {
      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
      soloTimerRef.current = setInterval(() => {
        dispatch({ type: ACTIONS.DECREMENT_SOLO_TIMER });
      }, 1000);
    } else {
      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    }
    return () => {
      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    };
  }, [state.gameMode, state.isSoloTimerRunning, state.gameOver]);

  useEffect(() => {
    if (state.gameMode === "classic" && state.timerValue <= 0 && state.isTimerRunning && !state.gameOver && state.timerConfig > 0) {
      playSound("timer_alarm");
      dispatch({ type: ACTIONS.TIMER_EXPIRED });
    } else if ((state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && state.soloTotalTimeValue <= 0 && state.isSoloTimerRunning && !state.gameOver) {
      playSound("timer_alarm");
      dispatch({ type: ACTIONS.SOLO_TIMER_EXPIRED });
      if (state.gameMode === "daily_challenge") {
        localStorage.setItem(getDailyChallengeCompletedKey(), "true");
        setDailyChallengeCompleted(true);
      }
      setShowNameInput(true);
    }
  }, [state.gameMode, state.timerValue, state.soloTotalTimeValue, state.isTimerRunning, state.isSoloTimerRunning, state.gameOver, playSound, dispatch, state.timerConfig]);

  useEffect(() => {
    let messageKey = state.message;
    let messageOptions = {};
    let soundToPlay = null;

    if (messageKey && typeof messageKey === 'string') {
        switch(state.gameMode) {
            case "classic":
                // ... (classic mode message logic remains the same)
                if (messageKey.startsWith("message_timer_expired_player_")) {
                    const expiredPlayer = messageKey.includes("_1") ? 1 : 2;
                    messageOptions = { penalty: -1, nextPlayer: expiredPlayer === 1 ? 2 : 1 };
                } else if (messageKey.startsWith("message_player_") && messageKey.includes("_found_hap")) {
                    const player = messageKey.includes("_1") ? 1 : 2;
                    messageOptions = { player, points: 1 };
                    soundToPlay = "correct";
                } else if (messageKey.startsWith("message_not_hap_player_")) {
                    const player = messageKey.includes("_1") ? 1 : 2;
                    messageOptions = { points: -1, nextPlayer: player === 1 ? 2 : 1 };
                    soundToPlay = "incorrect";
                } else if (messageKey.startsWith("message_player_") && messageKey.includes("_selected_cards")) {
                    const player = messageKey.includes("_1") ? 1 : 2;
                    messageOptions = { player, count: state.selectedCards.length };
                } else if (messageKey.startsWith("message_player_") && messageKey.includes("_gyul_correct")) {
                    const player = messageKey.includes("_1") ? 1 : 2;
                    messageOptions = { player, points: 3, round: state.round > 1 ? state.round -1 : 1 }; 
                    soundToPlay = "gyul_win";
                } else if (messageKey.includes("message_starting_round")) {
                    messageOptions = { nextRound: state.round, nextPlayer: state.currentPlayer };
                } else if (messageKey.startsWith("message_gyul_incorrect_player_")) {
                    const player = messageKey.includes("_1") ? 1 : 2;
                    const haps = find_all_haps(state.boardCards)
                    messageOptions = { points: -1, remainingHaps: haps ? haps.length : 0, nextPlayer: player === 1 ? 2 : 1 };
                    soundToPlay = "incorrect";
                } else if (messageKey.startsWith("message_game_over_player_")){
                    const winner = messageKey.includes("_1") ? 1 : (messageKey.includes("_2") ? 2 : 0);
                    messageOptions = { winner };
                } else if (messageKey === "message_game_over_draw"){
                    // no options needed
                }
                break;
            case "solo_time_attack":
            case "daily_challenge":
                if (messageKey === "message_solo_hap_found") {
                    messageOptions = { score: state.soloScore };
                    soundToPlay = "correct";
                } else if (messageKey === "message_solo_not_hap") {
                    messageOptions = { score: state.soloScore };
                    soundToPlay = "incorrect";
                } else if (messageKey === "message_solo_selected_cards") {
                    messageOptions = { count: state.selectedCards.length };
                } else if (messageKey === "message_solo_time_up_game_over" || messageKey === "message_solo_no_more_haps_game_over") {
                    messageOptions = { score: state.soloScore };
                    if (state.gameMode === "daily_challenge") {
                        localStorage.setItem(getDailyChallengeCompletedKey(), "true");
                        setDailyChallengeCompleted(true);
                    }
                    setShowNameInput(true);
                }
                break;
        }

        if (soundToPlay) playSound(soundToPlay);

        if(state.message.includes("message_starting_round")){
            const baseKey = state.message.split(" ")[0];
            const fullMessage = t(baseKey, messageOptions) + t("message_starting_round", {nextRound: state.round, nextPlayer: state.currentPlayer});
            dispatch({type: ACTIONS.SET_MESSAGE, payload: {message: fullMessage}});
        } else {
            const translatedMessage = t(messageKey, messageOptions);
            if (translatedMessage !== state.message) {
                 dispatch({type: ACTIONS.SET_MESSAGE, payload: {message: translatedMessage }});
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message, playSound, t, state.selectedCards.length, state.round, state.currentPlayer, state.boardCards, state.gameMode, state.soloScore, dispatch]);

  const handleCardClick = (cardId) => {
    if (state.gameOver) return;
    if (state.gameMode === "classic" && !state.isTimerRunning && state.timerConfig !== 0) return;
    if ((state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && !state.isSoloTimerRunning) return;

    playSound("select");
    dispatch({ type: ACTIONS.SELECT_CARD, payload: { cardId } });
  };

  const handleGyulClick = () => {
    if (state.gameMode !== "classic" || state.gameOver || (!state.isTimerRunning && state.timerConfig !== 0)) return;
    dispatch({ type: ACTIONS.CALL_GYUL });
  };

  const handleStartGame = () => {
    let cardSetToUse = CARD_SETS[selectedCardSetKey] || CARD_SETS.default;
    let dailySeed = undefined;

    if (selectedGameMode === "daily_challenge") {
        dailySeed = getDailySeed();
        // Daily challenge could use a fixed card set, e.g., default, or be configurable
        // For now, let's assume it uses the currently selected card set or a default one if specified.
        // cardSetToUse = CARD_SETS.default; // Or make it a specific setting for daily
        localStorage.setItem(getDailyChallengeCompletedKey(), "false"); // Reset for new attempt if not completed
        setDailyChallengeCompleted(false);
    }
    updateCardSet(cardSetToUse.shapes, cardSetToUse.colors, cardSetToUse.bgColors);

    dispatch({ 
        type: ACTIONS.SET_GAME_CONFIG, 
        payload: { 
            gameMode: selectedGameMode,
            timerDuration: selectedTimerDurationClassic, 
            maxRounds: selectedMaxRounds, 
            soloTime: selectedSoloTime,
            cardSetConfig: cardSetToUse,
            dailySeed: dailySeed // Pass the seed to gameLogic
        }
    });
    dispatch({ type: ACTIONS.START_GAME });
    setShowSettings(false);
    setShowNameInput(false);
    setPlayerNameForLeaderboard("");
    if(isMusicPlaying && musicTracks && musicTracks.background_1 && !musicTracks.background_1.playing()) playMusic();
  };

  const handleGameModeChange = (event) => {
    const mode = event.target.value;
    setSelectedGameMode(mode);
    localStorage.setItem("gyulhapGameMode", mode);
    if (mode === "daily_challenge") {
        setDailyChallengeCompleted(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");
    }
  };

  const handleTimerDurationClassicChange = (event) => {
    const newDuration = parseInt(event.target.value, 10);
    setSelectedTimerDurationClassic(newDuration);
    localStorage.setItem("gyulhapTimerConfigClassic", newDuration.toString());
  };

  const handleMaxRoundsChange = (event) => {
    const newRounds = parseInt(event.target.value, 10);
    setSelectedMaxRounds(newRounds);
    localStorage.setItem("gyulhapMaxRoundsConfig", newRounds.toString());
  };

  const handleSoloTimeChange = (event) => {
    const newTime = parseInt(event.target.value, 10);
    setSelectedSoloTime(newTime);
    localStorage.setItem("gyulhapTimerConfigSolo", newTime.toString());
  };

  const handleCardSetChange = (event) => {
    const setKey = event.target.value;
    setSelectedCardSetKey(setKey);
    localStorage.setItem(CARD_SET_STORAGE_KEY, setKey);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (showSettings) {
        dispatch({ type: ACTIONS.SET_MESSAGE, payload: { message: t("message_player_1_turn") } });
    }
  };
  
  const handleToggleMusic = () => {
    toggleMusic();
  };

  const handleToggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleSubmitNameToLeaderboard = (e) => {
    e.preventDefault();
    if (playerNameForLeaderboard.trim() && (state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && state.gameOver) {
      addScoreToLeaderboard(playerNameForLeaderboard.trim(), state.soloScore, state.gameMode);
      setShowNameInput(false);
      setPlayerNameForLeaderboard("");
      setIsLeaderboardOpen(true);
    }
  };

  let gameMessageAreaClasses = "game-message-area";
  const currentMessageText = state.message;
  if (typeof currentMessageText === 'string') {
      if (currentMessageText.includes(t("message_player_1_found_hap").split(" ")[2]) || 
          currentMessageText.includes(t("message_solo_hap_found").split(" ")[0]) || 
          currentMessageText.includes(t("message_player_1_gyul_correct").split(" ")[3])) {
        gameMessageAreaClasses += " message-correct";
      } else if (currentMessageText.includes(t("message_not_hap_player_1").split(" ")[0]) || 
                 currentMessageText.includes(t("message_solo_not_hap").split(" ")[0]) || 
                 currentMessageText.includes(t("message_gyul_incorrect_player_1").split(" ")[0]) || 
                 currentMessageText.includes(t("message_timer_expired_player_1").split(" ")[1])) {
        gameMessageAreaClasses += " message-incorrect";
      }
  }
  if (state.gameOver) gameMessageAreaClasses += " text-xl font-bold";
  else gameMessageAreaClasses += " text-md";

  if (showSettings) {
    return (
      <div className="game-container settings-view bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen p-4">
        <h1 className="game-title mb-6">{t("gyul_hap_title")}</h1>
        <h2 className="settings-title">{t("settings_title")}</h2>
        
        <div className="setting-item">
          <label htmlFor="gameModeSelect">{t("settings_game_mode")} </label>
          <select id="gameModeSelect" value={selectedGameMode} onChange={handleGameModeChange} className="settings-select bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
            <option value="classic">{t("settings_mode_classic")}</option>
            <option value="solo_time_attack">{t("settings_mode_solo")}</option>
            <option value="daily_challenge">{t("settings_mode_daily_challenge")}{dailyChallengeCompleted ? ` (${t("settings_daily_completed")})` : ""}</option>
          </select>
        </div>

        {selectedGameMode === "classic" && (
          <>
            {/* Classic mode settings */}
            <div className="setting-item">
              <label htmlFor="timerDurationClassic">{t("settings_timer_duration")} </label>
              <select id="timerDurationClassic" value={selectedTimerDurationClassic} onChange={handleTimerDurationClassicChange} className="settings-select bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                <option value="0">{t("settings_timer_option_off")}</option>
                <option value="15">15s</option>
                <option value="30">30s{t("settings_timer_duration_default")}</option>
                <option value="45">45s</option>
                <option value="60">60s</option>
                <option value="90">90s</option>
              </select>
            </div>
            <div className="setting-item">
              <label htmlFor="maxRounds">{t("settings_rounds_number")} </label>
              <select id="maxRounds" value={selectedMaxRounds} onChange={handleMaxRoundsChange} className="settings-select bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                <option value="5">5</option>
                <option value="10">10{t("settings_timer_duration_default")}</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="0">{t("settings_rounds_unlimited")}</option>
              </select>
            </div>
          </>
        )}

        {(selectedGameMode === "solo_time_attack" || selectedGameMode === "daily_challenge") && (
            <div className="setting-item">
              <label htmlFor="soloTime">{t("settings_timer_duration_solo")} </label>
              <select 
                id="soloTime" 
                value={selectedSoloTime} 
                onChange={handleSoloTimeChange} 
                className="settings-select bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                disabled={selectedGameMode === "daily_challenge"} // Daily challenge might have a fixed time
              >
                <option value="60">1 min</option>
                <option value="120">2 min</option>
                <option value="180">3 min{selectedGameMode !== "daily_challenge" ? t("settings_timer_duration_default") : ""}</option>
                <option value="300">5 min</option>
              </select>
              {selectedGameMode === "daily_challenge" && <p className="text-sm ml-2">({t("settings_daily_fixed_time")})</p>}
            </div>
        )}

        <div className="setting-item">
          <label htmlFor="cardSetSelect">{t("settings_card_set")} </label>
          <select 
            id="cardSetSelect" 
            value={selectedCardSetKey} 
            onChange={handleCardSetChange} 
            className="settings-select bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            disabled={selectedGameMode === "daily_challenge"} // Daily challenge might use a fixed card set
          >
            {Object.keys(CARD_SETS).map(key => (
              <option key={key} value={key}>{CARD_SETS[key].name || key}</option>
            ))}
          </select>
          {selectedGameMode === "daily_challenge" && <p className="text-sm ml-2">({t("settings_daily_fixed_card_set")})</p>}
        </div>

        <div className="setting-item language-selector">
            <label>{t("language_selector_label")} </label>
            <div>
                <button onClick={() => handleLanguageChange("pt")} className={`game-button secondary-button lang-button ${currentLanguage === "pt" ? "active" : ""} mr-1`}>PT</button>
                <button onClick={() => handleLanguageChange("en")} className={`game-button secondary-button lang-button ${currentLanguage === "en" ? "active" : ""}`}>EN</button>
            </div>
        </div>
        <div className="setting-item">
            <label>{t("settings_theme_label")}</label>
            <button onClick={handleToggleTheme} className="game-button secondary-button">
                {theme === "light" ? t("settings_theme_dark") : t("settings_theme_light")}
            </button>
        </div>
        <div className="setting-item">
            <button onClick={() => setIsTutorialOpen(true)} className="game-button secondary-button">{t("tutorial_button_label")}</button>
            <button onClick={() => setIsLeaderboardOpen(true)} className="game-button secondary-button ml-2">{t("leaderboard_title").split("(")[0]}</button>
        </div>
        <button 
            onClick={handleStartGame} 
            className="game-button start-game-button mt-4"
            disabled={selectedGameMode === "daily_challenge" && dailyChallengeCompleted}
        >
          {selectedGameMode === "daily_challenge" && dailyChallengeCompleted ? t("settings_daily_already_completed") : t("settings_start_game_button")}
        </button>
        <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
        <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} scores={leaderboardScores} onClear={handleClearLeaderboard} />
      </div>
    );
  }

  // ... (rest of the Game component remains the same)
  return (
    <div className="game-container bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen p-4">
      <div className="game-header">
        <h1 className="game-title">{t("gyul_hap_title")}</h1>
        <div className="header-controls flex items-center">
            <button onClick={() => { setShowSettings(true); if(isMusicPlaying && musicTracks && musicTracks.background_1) stopMusic("background_1"); dispatch({type: ACTIONS.SET_GAME_MODE, payload: {mode: state.gameMode}});}} className="settings-button-ingame mute-button mr-2">
              {t("settings_button_label")}
            </button>
            <button onClick={handleToggleMusic} className="mute-button mr-2">
              {isMusicPlaying ? t("toggle_music_off") : t("toggle_music_on")}
            </button>
            <button onClick={toggleMute} className="mute-button mr-2">
              {isMuted ? t("mute_button_sound_off") : t("mute_button_sound_on")}
            </button>
            <button onClick={handleToggleTheme} className="mute-button">
                {theme === "light" ? t("settings_theme_dark_icon") : t("settings_theme_light_icon")}
            </button>
        </div>
      </div>
      
      <div className="scoreboard-area">
        {state.gameMode === "classic" && <p>{t("scoreboard_round", { round: state.round })}</p>}
        {state.gameMode === "classic" && !state.gameOver && state.timerConfig !== 0 && (
          <p className="timer-display">{t("scoreboard_time", { timeValue: state.timerValue })}</p>
        )}
        {(state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && !state.gameOver && (
            <p className="timer-display">{t("scoreboard_solo_time", { timeValue: state.soloTotalTimeValue })}</p>
        )}
        {(state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && (
            <p>{t("scoreboard_solo_score", { score: state.soloScore })}</p>
        )}
        {state.gameMode === "daily_challenge" && <p className="text-sm">{t("daily_challenge_title")}</p>}
      </div>

      {currentMessageText && (
        <div className={gameMessageAreaClasses} role="alert">
          {currentMessageText}
        </div>
      )}

      {!state.gameOver && (
        <Board 
          cards={state.boardCards} 
          selectedCards={state.selectedCards} 
          onCardClick={handleCardClick} 
          lastAction={currentMessageText} 
          gameMode={state.gameMode}
        />
      )}

      {state.gameOver && (
        <div className="text-center mt-6">
          {(state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && showNameInput && (
            <form onSubmit={handleSubmitNameToLeaderboard} className="name-input-form mb-4">
              <label htmlFor="playerNameInput" className="sr-only">{t("name_input_label")}</label>
              <input 
                id="playerNameInput"
                type="text"
                value={playerNameForLeaderboard}
                onChange={(e) => setPlayerNameForLeaderboard(e.target.value)}
                placeholder={t("name_input_placeholder")}
                className="name-input-field bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                maxLength={20}
              />
              <button type="submit" className="game-button submit-name-button ml-2">{t("name_input_submit_button")}</button>
            </form>
          )}
          <button onClick={() => {setShowSettings(true); if(isMusicPlaying && musicTracks && musicTracks.background_1) stopMusic("background_1"); dispatch({type: ACTIONS.SET_GAME_MODE, payload: {mode: state.gameMode}});}} className="game-button text-lg px-8 py-3">
            {t("game_over_play_again")}
          </button>
          <button onClick={() => setIsLeaderboardOpen(true)} className="game-button secondary-button ml-2 mt-2">{t("leaderboard_title").split("(")[0]}</button>
        </div>
      )}

      {state.gameMode === "classic" && !state.gameOver && (
        <div className="player-panels-container mt-6">
          <PlayerPanel
            playerName={t("player_panel_player_1")}
            score={state.player1Score}
            isCurrentTurn={state.currentPlayer === 1}
            onGyulClick={handleGyulClick}
            gyulButtonText={t("player_panel_call_gyul")}
          />
          <PlayerPanel
            playerName={t("player_panel_player_2")}
            score={state.player2Score}
            isCurrentTurn={state.currentPlayer === 2}
            onGyulClick={handleGyulClick}
            gyulButtonText={t("player_panel_call_gyul")}
          />
        </div>
      )}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} scores={leaderboardScores} onClear={handleClearLeaderboard} />
    </div>
  );
};

export default Game;

