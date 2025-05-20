import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const LeaderboardModal = ({ isOpen, onClose, scores, onClear }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
    // Basic focus trapping
    if (event.key === "Tab" && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content leaderboard-modal bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leaderboard-modal-title" className="modal-title text-2xl font-bold mb-4 text-center">{t("leaderboard_title")}</h2>
        {scores && scores.length > 0 ? (
          <ol className="leaderboard-list space-y-2 mb-4" aria-label={t("leaderboard_list_aria_label")}>
            {scores.map((scoreItem, index) => (
              <li 
                key={index} 
                className="leaderboard-item flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded shadow"
                role="listitem"
              >
                <span className="font-medium">{index + 1}. {scoreItem.name}</span>
                <span className="font-bold text-lg text-yellow-500 dark:text-yellow-400">{scoreItem.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="leaderboard-empty text-center my-6 text-gray-600 dark:text-gray-400">{t("leaderboard_empty")}</p>
        )}
        <div className="modal-actions flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
            {scores && scores.length > 0 && (
                <button 
                  onClick={onClear} 
                  className="game-button secondary-button py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  aria-label={t("leaderboard_clear_button_aria_label") || "Clear all leaderboard scores"}
                >
                    {t("leaderboard_clear_button")}
                </button>
            )}
            <button 
              ref={closeButtonRef}
              onClick={onClose} 
              className="game-button py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              aria-label={t("leaderboard_close_button_aria_label") || "Close leaderboard"}
            >
                {t("tutorial_close_button")} 
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;

