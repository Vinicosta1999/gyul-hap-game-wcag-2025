import React from 'react';
import { useTranslation } from 'react-i18next';

const PlayerPanel = ({ playerName, score, isCurrentTurn, onGyulClick, gyulButtonText, isActive, gyulButtonDisabled }) => {
  const { t } = useTranslation();
  
  let turnIndicatorClass = isCurrentTurn ? 'border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-400 dark:ring-yellow-500' : 'border-gray-300 dark:border-gray-600';
  if (isActive === false) { // Explicitly check for false to indicate disconnected
    turnIndicatorClass = 'border-red-500 dark:border-red-700 opacity-60';
  }

  const playerPanelId = `player-panel-${playerName?.toLowerCase().replace(/[^a-z0-9]/gi, '-') || 'player'}`;
  const scoreId = `${playerPanelId}-score`;
  const gyulButtonId = `${playerPanelId}-gyul-button`;

  return (
    <div 
      className={`player-panel p-4 rounded-lg shadow-md ${turnIndicatorClass} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all`}
      id={playerPanelId}
      aria-labelledby={`${playerPanelId}-name`}
      role="region"
    >
      <h3 id={`${playerPanelId}-name`} className="text-lg font-semibold mb-2 text-yellow-500 dark:text-yellow-400 truncate">{playerName || t('unknown_player')}</h3>
      <p id={scoreId} className="text-2xl font-bold mb-3">{t('scoreboard_score_label', { score: score })}</p>
      {/* Display Gyul button only if onGyulClick is provided (e.g. for current player) */}
      {onGyulClick && (
        <button
          id={gyulButtonId}
          onClick={onGyulClick}
          disabled={gyulButtonDisabled}
          className="game-button w-full py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby={scoreId} 
        >
          {gyulButtonText || t('player_panel_call_gyul')}
        </button>
      )}
      {/* Placeholder to keep height consistent if no button is shown */}
      {!onGyulClick && (
          <div style={{ height: '44px' }} aria-hidden="true"></div> 
      )}
      {isActive === false && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-2">{t('player_panel_disconnected')}</p>
      )}
    </div>
  );
};

export default PlayerPanel;

