// src/types/gameTypes.ts

// Definição para as características de um conjunto de cartas
export interface CardSetInfo {
  name: string;
  shapes: string[];
  colors: string[];
  bgColors: string[];
}

// Definição base para uma carta do jogo
export interface Card {
  id: string;
  shape: string; // Ex: "circle", "square", "triangle"
  color: string; // Ex: "red", "blue", "green"
  background: string; // Ex: "solid", "striped", "empty"
  number: number; // Ex: 1, 2, 3
  // Adicionar quaisquer outras propriedades que uma carta possa ter
}

// Definição para uma entrada no placar
export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string; // ISO string date
  mode: string; // Ex: "classic", "solo_time_attack", "daily_challenge"
}

// Definição para o estado global do jogo
export interface GameState {
  // Estado compartilhado
  deck: Card[];
  boardCards: Card[];
  selectedCards: string[]; // Array de IDs das cartas selecionadas
  gameOver: boolean;
  message: string; // Chave i18n ou mensagem direta

  // Configurações persistidas
  timerConfig: number;
  maxRoundsConfig: number;
  soloTimeAttackDurationConfig: number;
  gameMode: "classic" | "solo_time_attack" | "daily_challenge";
  cardSetConfig: CardSetInfo; // Usando a interface definida acima
  dailySeed?: string; // Seed para o desafio diário

  // Estado do Modo Clássico
  player1Score: number;
  player2Score: number;
  currentPlayer: 1 | 2;
  round: number;
  timerValue: number;
  isTimerRunning: boolean;

  // Estado do Modo Solo Time Attack / Daily Challenge
  soloScore: number;
  soloTotalTimeValue: number;
  isSoloTimerRunning: boolean;
}

// Constantes de Ações (para evitar strings mágicas e ter autocompletar)
export const ACTIONS = {
  SET_GAME_MODE: "SET_GAME_MODE" as const,
  SET_GAME_CONFIG: "SET_GAME_CONFIG" as const,
  START_GAME: "START_GAME" as const,
  SELECT_CARD: "SELECT_CARD" as const,
  CALL_GYUL: "CALL_GYUL" as const,
  RESET_TIMER: "RESET_TIMER" as const,
  DECREMENT_TIMER: "DECREMENT_TIMER" as const,
  TIMER_EXPIRED: "TIMER_EXPIRED" as const,
  STOP_TIMER: "STOP_TIMER" as const,
  DECREMENT_SOLO_TIMER: "DECREMENT_SOLO_TIMER" as const,
  SOLO_TIMER_EXPIRED: "SOLO_TIMER_EXPIRED" as const,
  SOLO_FOUND_HAP: "SOLO_FOUND_HAP" as const, // Esta ação não existe no reducer original, verificar necessidade
  SOLO_NO_MORE_HAPS: "SOLO_NO_MORE_HAPS" as const,
  SET_MESSAGE: "SET_MESSAGE" as const,
};

// Tipos para cada ação específica
export interface SetGameModeAction {
  type: typeof ACTIONS.SET_GAME_MODE;
  payload: { mode: GameState["gameMode"] };
}

export interface SetGameConfigAction {
  type: typeof ACTIONS.SET_GAME_CONFIG;
  payload: {
    gameMode?: GameState["gameMode"]; // Adicionado para consistência com o reducer
    timerDuration?: number;
    maxRounds?: number;
    soloTime?: number;
    cardSetConfig?: CardSetInfo; // Usando a interface definida
    dailySeed?: string;
  };
}

export interface StartGameAction {
  type: typeof ACTIONS.START_GAME;
}

export interface SelectCardAction {
  type: typeof ACTIONS.SELECT_CARD;
  payload: { cardId: string };
}

export interface CallGyulAction {
  type: typeof ACTIONS.CALL_GYUL;
}

export interface ResetTimerAction {
  type: typeof ACTIONS.RESET_TIMER;
}

export interface DecrementTimerAction {
  type: typeof ACTIONS.DECREMENT_TIMER;
}

export interface TimerExpiredAction {
  type: typeof ACTIONS.TIMER_EXPIRED;
}

export interface StopTimerAction {
  type: typeof ACTIONS.STOP_TIMER;
}

export interface DecrementSoloTimerAction {
  type: typeof ACTIONS.DECREMENT_SOLO_TIMER;
}

export interface SoloTimerExpiredAction {
  type: typeof ACTIONS.SOLO_TIMER_EXPIRED;
}

export interface SoloNoMoreHapsAction {
  type: typeof ACTIONS.SOLO_NO_MORE_HAPS;
}

export interface SetMessageAction {
  type: typeof ACTIONS.SET_MESSAGE;
  payload: { message: string };
}

// Tipo união para todas as ações possíveis do jogo
export type GameAction =
  | SetGameModeAction
  | SetGameConfigAction
  | StartGameAction
  | SelectCardAction
  | CallGyulAction
  | ResetTimerAction
  | DecrementTimerAction
  | TimerExpiredAction
  | StopTimerAction
  | DecrementSoloTimerAction
  | SoloTimerExpiredAction
  | SoloNoMoreHapsAction
  | SetMessageAction;

