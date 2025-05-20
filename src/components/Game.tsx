import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Board from "./Board.jsx"; 
import PlayerPanel from "./PlayerPanel.jsx";
import TutorialModal from "./TutorialModal";
import LeaderboardModal from "./LeaderboardModal";
import { GameState, GameAction, ACTIONS as T_ACTIONS, CardSetInfo, Card } from "../types/gameTypes"; 
import { 
    gameReducer, INITIAL_STATE, 
    DEFAULT_TIMER_DURATION, DEFAULT_MAX_ROUNDS, DEFAULT_SOLO_TIME_ATTACK_DURATION 
} from "../lib/gameLogic";
import { useSound } from "../lib/useSound";
import { find_all_haps, CARD_SETS, updateCardSet, getDailySeed } from "../lib/cardUtils";

const MAX_LEADERBOARD_ENTRIES = 10;
const LEADERBOARD_STORAGE_KEY = "gyulhapLeaderboard";
const CARD_SET_STORAGE_KEY = "gyulhapCardSet";
const DAILY_CHALLENGE_COMPLETED_KEY_PREFIX = "gyulhapDailyChallengeCompleted_";

const Game = () => {
  const { t, i18n } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    if (currentTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  const toggleSystemTheme = () => {
    setCurrentTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  const getDailyChallengeCompletedKey = () => {
    const today = new Date().toISOString().split("T")[0];
    return `${DAILY_CHALLENGE_COMPLETED_KEY_PREFIX}${today}`;
  };

  const initialGameConfig = useCallback(() => {
    const storedCardSetKey = localStorage.getItem(CARD_SET_STORAGE_KEY) || "default";
    const validCardSetKey = CARD_SETS[storedCardSetKey as keyof typeof CARD_SETS] ? storedCardSetKey : "default";
    const initialCardSet = CARD_SETS[validCardSetKey as keyof typeof CARD_SETS] as CardSetInfo;
    updateCardSet(initialCardSet.shapes, initialCardSet.colors, initialCardSet.bgColors);

    const initialLogicState = INITIAL_STATE as Partial<GameState>;

    const baseState: GameState = {
        deck: initialLogicState.deck || [],
        boardCards: initialLogicState.boardCards || [],
        selectedCards: initialLogicState.selectedCards || [],
        gameOver: initialLogicState.gameOver || false,
        message: initialLogicState.message || "",
        player1Score: initialLogicState.player1Score || 0,
        player2Score: initialLogicState.player2Score || 0,
        currentPlayer: (initialLogicState.currentPlayer === 2 ? 2 : 1),
        round: initialLogicState.round || 1,
        isTimerRunning: initialLogicState.isTimerRunning || false,
        soloScore: initialLogicState.soloScore || 0,
        isSoloTimerRunning: initialLogicState.isSoloTimerRunning || false,
        timerConfig: parseInt(localStorage.getItem("gyulhapTimerConfigClassic") || (initialLogicState.timerConfig?.toString() ?? DEFAULT_TIMER_DURATION.toString()), 10),
        maxRoundsConfig: parseInt(localStorage.getItem("gyulhapMaxRoundsConfig") || (initialLogicState.maxRoundsConfig?.toString() ?? DEFAULT_MAX_ROUNDS.toString()), 10),
        soloTimeAttackDurationConfig: parseInt(localStorage.getItem("gyulhapTimerConfigSolo") || (initialLogicState.soloTimeAttackDurationConfig?.toString() ?? DEFAULT_SOLO_TIME_ATTACK_DURATION.toString()), 10),
        gameMode: (localStorage.getItem("gyulhapGameMode") as GameState["gameMode"]) || initialLogicState.gameMode || "classic",
        cardSetConfig: initialCardSet,
        ...(initialLogicState.dailySeed && { dailySeed: initialLogicState.dailySeed }),
        timerValue: 0,
        soloTotalTimeValue: 0,
    };

    baseState.timerValue = baseState.timerConfig;
    baseState.soloTotalTimeValue = baseState.soloTimeAttackDurationConfig;
    baseState.message = t("message_player_1_turn");
    return baseState;
  }, [t]);

  const [state, dispatch] = useReducer<React.Reducer<GameState, GameAction>>(gameReducer, initialGameConfig());
  const { playSound, toggleMute, isMuted, playMusic, /*stopMusic,*/ isMusicPlaying, toggleMusic } = useSound(); // Removed stopMusic
  
  const classicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soloTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showSettings, setShowSettings] = useState(true);
  const [selectedGameMode, setSelectedGameMode] = useState<GameState["gameMode"]>(state.gameMode);
  const [selectedTimerDurationClassic, setSelectedTimerDurationClassic] = useState(state.timerConfig);
  const [selectedMaxRounds, setSelectedMaxRounds] = useState(state.maxRoundsConfig);
  const [selectedSoloTime, setSelectedSoloTime] = useState(state.soloTimeAttackDurationConfig);
  const [selectedCardSetKey, setSelectedCardSetKey] = useState(localStorage.getItem(CARD_SET_STORAGE_KEY) || "default");
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language.split("-")[0]);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardScores, setLeaderboardScores] = useState<any[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerNameForLeaderboard, setPlayerNameForLeaderboard] = useState("");
  const [hasInteractedForMusic, setHasInteractedForMusic] = useState(false);

  useEffect(() => {
    if (hasInteractedForMusic && !isMusicPlaying) {
      playMusic("background_1");
    }
  }, [hasInteractedForMusic, isMusicPlaying, playMusic]);

  useEffect(() => {
    setDailyChallengeCompleted(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");
  }, []);

  useEffect(() => {
    const storedScores = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (storedScores) {
      setLeaderboardScores(JSON.parse(storedScores));
    }
  }, []);

  const saveLeaderboardScores = (scores: any[]) => {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
    setLeaderboardScores(scores);
  };

  const addScoreToLeaderboard = (name: string, score: number, mode: string) => {
    const newScore = { name, score, date: new Date().toISOString(), mode };
    const updatedScores = [...leaderboardScores, newScore]
      .sort((a, b) => b.score - a.score)
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
        dispatch({ type: T_ACTIONS.DECREMENT_TIMER });
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
        dispatch({ type: T_ACTIONS.DECREMENT_SOLO_TIMER });
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
      dispatch({ type: T_ACTIONS.TIMER_EXPIRED });
    } else if ((state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && state.soloTotalTimeValue <= 0 && state.isSoloTimerRunning && !state.gameOver) {
      playSound("timer_alarm");
      dispatch({ type: T_ACTIONS.SOLO_TIMER_EXPIRED });
      if (state.gameMode === "daily_challenge") {
        localStorage.setItem(getDailyChallengeCompletedKey(), "true");
        setDailyChallengeCompleted(true);
      }
      setShowNameInput(true);
    }
  }, [state.gameMode, state.timerValue, state.soloTotalTimeValue, state.isTimerRunning, state.isSoloTimerRunning, state.gameOver, playSound, dispatch, state.timerConfig]);

  useEffect(() => {
    const messageKey = state.message;
    let messageOptions: any = {};
    let soundToPlay: string | null = null;

    if (messageKey && typeof messageKey === "string") {
        switch(state.gameMode) {
            case "classic":
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
                    const haps = find_all_haps(state.boardCards as Card[]) 
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
            dispatch({type: T_ACTIONS.SET_MESSAGE, payload: {message: String(fullMessage)}});
        } else {
            const translatedMessage = t(messageKey, messageOptions);
            if (String(translatedMessage) !== state.message) {
                 dispatch({type: T_ACTIONS.SET_MESSAGE, payload: {message: String(translatedMessage) }});
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message, playSound, t, state.selectedCards.length, state.round, state.currentPlayer, state.boardCards, state.gameMode, state.soloScore, dispatch]);

  const handleCardClick = (cardId: string) => {
    if (state.gameOver) return;
    if (state.gameMode === "classic" && !state.isTimerRunning && state.timerConfig !== 0) return;
    if ((state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && !state.isSoloTimerRunning) return;

    playSound("select");
    dispatch({ type: T_ACTIONS.SELECT_CARD, payload: { cardId } });
  };

  const handleGyulClick = () => {
    if (state.gameMode !== "classic" || state.gameOver || (!state.isTimerRunning && state.timerConfig !== 0)) return;
    dispatch({ type: T_ACTIONS.CALL_GYUL });
  };

  const handleStartGame = () => {
    if (!hasInteractedForMusic) setHasInteractedForMusic(true); 

    const cardSetToUse = CARD_SETS[selectedCardSetKey as keyof typeof CARD_SETS] || CARD_SETS.default;
    let dailySeed: string | undefined = undefined;

    if (selectedGameMode === "daily_challenge") {
        dailySeed = String(getDailySeed());
        localStorage.setItem(getDailyChallengeCompletedKey(), "false"); 
        setDailyChallengeCompleted(false);
    }
    updateCardSet(cardSetToUse.shapes, cardSetToUse.colors, cardSetToUse.bgColors);

    dispatch({ 
        type: T_ACTIONS.SET_GAME_CONFIG, 
        payload: { 
            gameMode: selectedGameMode,
            timerDuration: selectedTimerDurationClassic, 
            maxRounds: selectedMaxRounds, 
            soloTime: selectedSoloTime,
            cardSetConfig: cardSetToUse,
            dailySeed: dailySeed 
        }
    });
    dispatch({ type: T_ACTIONS.START_GAME });
    setShowSettings(false);
    setShowNameInput(false);
    setPlayerNameForLeaderboard("");
  };

  const handleGameModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as GameState["gameMode"];
    setSelectedGameMode(mode);
    localStorage.setItem("gyulhapGameMode", mode);
    if (mode === "daily_challenge") {
        setDailyChallengeCompleted(localStorage.getItem(getDailyChallengeCompletedKey()) === "true");
    }
  };

  const handleTimerDurationClassicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = parseInt(event.target.value, 10);
    setSelectedTimerDurationClassic(newDuration);
    localStorage.setItem("gyulhapTimerConfigClassic", newDuration.toString());
  };

  const handleMaxRoundsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRounds = parseInt(event.target.value, 10);
    setSelectedMaxRounds(newRounds);
    localStorage.setItem("gyulhapMaxRoundsConfig", newRounds.toString());
  };

  const handleSoloTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = parseInt(event.target.value, 10);
    setSelectedSoloTime(newTime);
    localStorage.setItem("gyulhapTimerConfigSolo", newTime.toString());
  };

  const handleCardSetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSetKey = event.target.value;
    setSelectedCardSetKey(newSetKey);
    localStorage.setItem(CARD_SET_STORAGE_KEY, newSetKey);
    const newCardSet = CARD_SETS[newSetKey as keyof typeof CARD_SETS] || CARD_SETS.default;
    updateCardSet(newCardSet.shapes, newCardSet.colors, newCardSet.bgColors);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  const handleResetGame = () => {
    setShowSettings(true);
    dispatch({ type: T_ACTIONS.SET_GAME_MODE, payload: { mode: selectedGameMode } }); 
    dispatch({ type: T_ACTIONS.START_GAME }); 
  };

  const handlePlayerNameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (playerNameForLeaderboard.trim()) {
      addScoreToLeaderboard(playerNameForLeaderboard, state.soloScore, state.gameMode);
      setShowNameInput(false);
      setPlayerNameForLeaderboard("");
    }
  };

  const handleToggleMusic = () => {
    toggleMusic();
  };

  if (showSettings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="absolute top-4 right-4 flex items-center">
            <button onClick={toggleSystemTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                {currentTheme === "light" ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> :
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-12.66l-.707.707M4.04 19.96l-.707.707M21 12h-1M4 12H3m15.66-4.34l-.707-.707M4.04 4.04l-.707-.707" /></svg>
                }
            </button>
            <select value={currentLanguage} onChange={handleLanguageChange} className="ml-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="es">Español</option>
                <option value="ko">한국어</option>
            </select>
        </div>
        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-8 text-blue-600 dark:text-blue-400">Gyul! Hap!</h1>
          
          <div className="mb-4">
            <label htmlFor="gameMode" className="block text-sm font-medium mb-1">{t("settings_game_mode")}</label>
            <select id="gameMode" value={selectedGameMode} onChange={handleGameModeChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
              <option value="classic">{t("game_mode_classic")}</option>
              <option value="solo_time_attack">{t("game_mode_solo_time_attack")}</option>
              <option value="daily_challenge">{t("game_mode_daily_challenge")} {dailyChallengeCompleted ? "(Completed)" : ""}</option>
            </select>
          </div>

          {selectedGameMode === "classic" && (
            <>
              <div className="mb-4">
                <label htmlFor="timerDurationClassic" className="block text-sm font-medium mb-1">{t("settings_timer_duration_classic")}</label>
                <select id="timerDurationClassic" value={selectedTimerDurationClassic} onChange={handleTimerDurationClassicChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
                  <option value="0">{t("timer_off")}</option>
                  <option value="15">15 {t("seconds_short")}</option>
                  <option value="30">30 {t("seconds_short")}</option>
                  <option value="45">45 {t("seconds_short")}</option>
                  <option value="60">60 {t("seconds_short")}</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="maxRounds" className="block text-sm font-medium mb-1">{t("settings_max_rounds")}</label>
                <select id="maxRounds" value={selectedMaxRounds} onChange={handleMaxRoundsChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
                  <option value="0">{t("rounds_unlimited")}</option>
                  <option value="5">5 {t("rounds_label")}</option>
                  <option value="10">10 {t("rounds_label")}</option>
                  <option value="15">15 {t("rounds_label")}</option>
                  <option value="20">20 {t("rounds_label")}</option>
                </select>
              </div>
            </>
          )}

          {selectedGameMode === "solo_time_attack" && (
            <div className="mb-4">
              <label htmlFor="soloTime" className="block text-sm font-medium mb-1">{t("settings_solo_time_attack_duration")}</label>
              <select id="soloTime" value={selectedSoloTime} onChange={handleSoloTimeChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
                <option value="60">1 {t("minute_short")}</option>
                <option value="120">2 {t("minutes_short")}</option>
                <option value="180">3 {t("minutes_short")}</option>
                <option value="300">5 {t("minutes_short")}</option>
              </select>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="cardSet" className="block text-sm font-medium mb-1">{t("settings_card_set")}</label>
            <select id="cardSet" value={selectedCardSetKey} onChange={handleCardSetChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
              {Object.keys(CARD_SETS).map(key => (
                <option key={key} value={key}>{t(CARD_SETS[key as keyof typeof CARD_SETS].name)}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleStartGame} 
            disabled={selectedGameMode === "daily_challenge" && dailyChallengeCompleted}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-lg mb-3 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedGameMode === "daily_challenge" && dailyChallengeCompleted ? t("daily_challenge_completed_button") : t("settings_start_game_button")}
          </button>
          <div className="flex justify-around mt-4">
            <button onClick={() => setIsTutorialOpen(true)} className="text-blue-500 hover:underline">{t("tutorial_button")}</button>
            <button onClick={() => setIsLeaderboardOpen(true)} className="text-blue-500 hover:underline">{t("leaderboard_button")}</button>
          </div>
        </div>
        <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
        <LeaderboardModal 
            isOpen={isLeaderboardOpen} 
            onClose={() => setIsLeaderboardOpen(false)} 
            scores={leaderboardScores} 
            onClear={handleClearLeaderboard} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="w-full max-w-4xl mb-4">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Gyul! Hap! - {t(state.gameMode === "classic" ? "game_mode_classic" : state.gameMode === "solo_time_attack" ? "game_mode_solo_time_attack" : "game_mode_daily_challenge")}</h1>
            <div>
                <button onClick={handleToggleMusic} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
                    {isMusicPlaying ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.683 3.906 11 4.146 11 4.586v14.828c0 .44-.317.68-.707.477L5.586 15z" /></svg> :
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.683 3.906 11 4.146 11 4.586v14.828c0 .44-.317.68-.707.477L5.586 15zm9.95-6.076a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707l-1.414 1.414a.5.5 0 01-.707 0L14.12 12l1.414-1.414a.5.5 0 010-.707zM19.071 4.929a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707l-1.414 1.414a.5.5 0 01-.707-.707l1.414-1.414zM19.071 17.657a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707l-1.414 1.414a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 010-.707l1.414-1.414z" /></svg>
                    }
                </button>
                <button onClick={toggleMute} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
                    {isMuted ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17 14l-4-4m0 0l-4 4m4-4v12m-2-6h.01M7 10h.01" /></svg> :
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.683 3.906 11 4.146 11 4.586v14.828c0 .44-.317.68-.707.477L5.586 15z" /></svg>
                    }
                </button>
                <button onClick={handleResetGame} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    {t("settings_button_text")}
                </button>
            </div>
        </div>
      </header>
      
      {state.gameMode === "classic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-4">
          <PlayerPanel 
            playerName={`${t("player_label")} 1`}
            score={state.player1Score}
            isCurrentTurn={state.currentPlayer === 1}
            onGyulClick={handleGyulClick}
            gyulButtonDisabled={state.currentPlayer !== 1 || state.gameOver || (!state.isTimerRunning && state.timerConfig !== 0)}
            gyulButtonText={t("player_panel_call_gyul")}
            isActive={true} 
          />
          <PlayerPanel 
            playerName={`${t("player_label")} 2`}
            score={state.player2Score}
            isCurrentTurn={state.currentPlayer === 2}
            onGyulClick={handleGyulClick}
            gyulButtonDisabled={state.currentPlayer !== 2 || state.gameOver || (!state.isTimerRunning && state.timerConfig !== 0)}
            gyulButtonText={t("player_panel_call_gyul")}
            isActive={true} 
          />
        </div>
      )}

      {(state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && (
        <div className="w-full max-w-4xl mb-4 text-center">
          <h2 className="text-2xl font-semibold">{t("score_label")}: {state.soloScore}</h2>
        </div>
      )}

      {state.message && (
        <div className={`game-message-area text-center p-3 my-3 rounded-md w-full max-w-3xl shadow
            ${state.message.toLowerCase().includes("incorrect") || state.message.toLowerCase().includes("expired") || state.message.toLowerCase().includes("error") ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200" :
            state.message.toLowerCase().includes("correct") || state.message.toLowerCase().includes("found") || state.message.toLowerCase().includes("success") ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200" :
            "bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-blue-200"}`} 
            role="alert" aria-live="polite">
          {state.message} 
        </div>
      )}

      <Board 
        cards={state.boardCards as Card[]} 
        onCardClick={handleCardClick} 
        selectedCards={state.selectedCards.map(id => state.boardCards.find(c => c.id === id)).filter(Boolean) as Card[]}
      />
      
      {state.gameMode === "classic" && state.currentPlayer && !state.gameOver && (
        <button 
            onClick={handleGyulClick} 
            disabled={state.gameOver || (!state.isTimerRunning && state.timerConfig !== 0)} 
            className="gyul-button bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded mt-6 text-xl shadow-md disabled:opacity-50"
        >
          GYUL!
        </button>
      )}
      
      {state.gameOver && (
        <div className="mt-8 text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <h3 className="text-3xl font-semibold mb-3">{t("game_over_title")}</h3>
          <p className="text-xl mb-6">{state.message}</p>
          {showNameInput && (state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && (
            <form onSubmit={handlePlayerNameSubmit} className="flex flex-col items-center mt-4">
              <label htmlFor="playerName" className="mb-2 text-lg">{t("enter_name_for_leaderboard")}</label>
              <input 
                type="text" 
                id="playerName" 
                value={playerNameForLeaderboard} 
                onChange={(e) => setPlayerNameForLeaderboard(e.target.value)} 
                className="p-2 border rounded-md mb-3 w-64 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                maxLength={20}
              />
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                {t("submit_score_button")}
              </button>
            </form>
          )}
          <button onClick={handleResetGame} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg mt-4">
            {t("play_again_button")}
          </button>
        </div>
      )}

      {state.gameMode === "classic" && state.timerConfig > 0 && state.isTimerRunning && (
        <div className="mt-6 text-2xl font-semibold">
          {t("time_left_label")} {state.timerValue}s
        </div>
      )}
      {(state.gameMode === "solo_time_attack" || state.gameMode === "daily_challenge") && state.isSoloTimerRunning && (
         <div className="mt-6 text-2xl font-semibold">
          {t("time_left_label")} {state.soloTotalTimeValue}s
        </div>
      )}
    </div>
  );
};

export default Game;

