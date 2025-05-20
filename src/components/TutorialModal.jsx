import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const TutorialModal = ({ isOpen, onClose }) => {
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
    // Basic focus trapping (can be improved with a more robust solution)
    if (event.key === "Tab" && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
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
      aria-labelledby="tutorial-modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tutorial-modal-title" className="modal-title text-2xl font-bold mb-4 text-center">{t("tutorial_modal_title")}</h2>
        
        <section aria-labelledby="tutorial-objective-heading">
          <h3 id="tutorial-objective-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_objective_title")}</h3>
          <p>{t("tutorial_objective_text")}</p>
        </section>

        <section aria-labelledby="tutorial-card-attributes-heading">
          <h3 id="tutorial-card-attributes-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_card_attributes_title")}</h3>
          <p>{t("tutorial_card_attributes_text")}</p>
          <ul className="list-disc list-inside ml-4">
            <li><strong>{t("tutorial_attribute_color")}:</strong> {t("tutorial_attribute_color_values")}</li>
            <li><strong>{t("tutorial_attribute_shape")}:</strong> {t("tutorial_attribute_shape_values")}</li>
            <li><strong>{t("tutorial_attribute_fill")}:</strong> {t("tutorial_attribute_fill_values")}</li>
            <li><strong>{t("tutorial_attribute_count")}:</strong> {t("tutorial_attribute_count_values")}</li>
          </ul>
        </section>

        <section aria-labelledby="tutorial-what-is-hap-heading">
          <h3 id="tutorial-what-is-hap-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_what_is_hap_title")}</h3>
          <p>{t("tutorial_what_is_hap_text_1")}</p>
          <p className="mt-2">{t("tutorial_what_is_hap_text_2")}</p>
          
          <h4 className="text-lg font-semibold mt-3 mb-1">{t("tutorial_hap_example_title")}</h4>
          <p className="whitespace-pre-line">{t("tutorial_hap_example_text")}</p>
        </section>

        <section aria-labelledby="tutorial-how-to-play-heading">
          <h3 id="tutorial-how-to-play-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_how_to_play_title")}</h3>
          <p>{t("tutorial_how_to_play_text_1")}</p>
          <p className="mt-2">{t("tutorial_how_to_play_text_2")}</p>
        </section>

        <section aria-labelledby="tutorial-calling-gyul-heading">
          <h3 id="tutorial-calling-gyul-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_calling_gyul_title")}</h3>
          <p>{t("tutorial_calling_gyul_text_1")}</p>
          <p className="mt-2">{t("tutorial_calling_gyul_text_2")}</p>
        </section>

        <section aria-labelledby="tutorial-scoring-heading">
          <h3 id="tutorial-scoring-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_scoring_title")}</h3>
          <ul className="list-disc list-inside ml-4">
              <li>{t("tutorial_scoring_hap")}</li>
              <li>{t("tutorial_scoring_incorrect_hap")}</li>
              <li>{t("tutorial_scoring_correct_gyul")}</li>
              <li>{t("tutorial_scoring_incorrect_gyul")}</li>
              <li>{t("tutorial_scoring_timer_penalty")}</li>
          </ul>
        </section>

        <section aria-labelledby="tutorial-game-modes-heading">
          <h3 id="tutorial-game-modes-heading" className="text-xl font-semibold mt-4 mb-2">{t("tutorial_game_modes_title")}</h3>
          <h4 className="text-lg font-semibold mt-3 mb-1">{t("settings_mode_classic")}</h4>
          <p>{t("tutorial_classic_mode_text")}</p>
          <h4 className="text-lg font-semibold mt-3 mb-1">{t("settings_mode_solo")}</h4>
          <p>{t("tutorial_solo_mode_text")}</p>
          <h4 className="text-lg font-semibold mt-3 mb-1">{t("settings_mode_daily_challenge")}</h4>
          <p>{t("tutorial_daily_challenge_text")}</p>
        </section>

        <button 
          ref={closeButtonRef}
          onClick={onClose} 
          className="modal-close-button game-button mt-6 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto"
          aria-label={t("tutorial_close_button_aria_label") || "Close tutorial"}
        >
          {t("tutorial_close_button")}
        </button>
      </div>
    </div>
  );
};

export default TutorialModal;

