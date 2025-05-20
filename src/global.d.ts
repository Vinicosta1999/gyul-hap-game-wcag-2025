import * as React from "react";
declare module "./components/Board.jsx" {
  const Board: any;
  export default Board;
}
declare module "./components/PlayerPanel.jsx" {
  interface PlayerPanelProps {
    playerName: string;
    score: number;
    isCurrentTurn: boolean;
    onGyulClick?: () => void;
    gyulButtonText?: string;
  }
  const PlayerPanel: React.FC<PlayerPanelProps>;
  export default PlayerPanel;
}
declare module "./components/TutorialModal.jsx" {
  const TutorialModal: any;
  export default TutorialModal;
}
declare module "./components/LeaderboardModal.jsx" {
  const LeaderboardModal: any;
  export default LeaderboardModal;
}
declare module "../lib/gameLogic" {
  export const gameReducer: React.Reducer<import("../types/gameTypes").GameState, import("../types/gameTypes").GameAction>;
  export const INITIAL_STATE: Partial<import("../types/gameTypes").GameState>;
  export const ACTIONS: typeof import("../types/gameTypes").ACTIONS;
  export const DEFAULT_TIMER_DURATION: number;
  export const DEFAULT_MAX_ROUNDS: number;
  export const DEFAULT_SOLO_TIME_ATTACK_DURATION: number;
  const gameLogic: any;
  export default gameLogic;
}
declare module "../lib/useSound" {
  interface MusicTrack {
    playing: () => boolean;
    [key: string]: any;
  }
  interface MusicTracks {
    [key: string]: MusicTrack | any;
  }
  interface UseSoundReturn {
    playSound: (soundName: string) => void;
    toggleMute: () => void;
    isMuted: boolean;
    playMusic: (musicName: string) => void;
    stopMusic: () => void;
    isMusicPlaying: boolean;
    toggleMusic: () => void;
    musicTracks: MusicTracks | null | undefined;
  }
  export const useSound: () => UseSoundReturn;
  const useSoundModule: any;
  export default useSoundModule;
}
declare module "../lib/cardUtils" {
  interface CardSetInfo {
    shapes: string[];
    colors: string[];
    bgColors: string[];
    name: string;
  }
  export const CARD_SETS: { [key: string]: CardSetInfo; default: CardSetInfo; };
  export const find_all_haps: any;
  export const updateCardSet: any;
  export const getDailySeed: () => string;
  export const shuffleDeck: any;
  export const ALL_CARDS: any;
  export const is_hap: any;
  const cardUtils: any;
  export default cardUtils;
}

