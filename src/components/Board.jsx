import React from 'react';
import CardComponent from './Card';
import { useTranslation } from 'react-i18next';

const Board = ({ cards, selectedCards, onCardClick }) => {
  const { t } = useTranslation();
  const displayCards = cards ? [...cards] : [];
  while (displayCards.length < 9) {
    displayCards.push(null);
  }

  return (
    <div className="board-grid" role="grid" aria-label={t('board_aria_label')}>
      {displayCards.slice(0, 9).map((card, index) => (
        <div 
          key={card ? card.id : `slot-${index}`}
          className="flex flex-col items-center" 
          role="gridcell"
          aria-label={card ? t('card_slot_aria_label', { slotNumber: index + 1, cardDescription: `${card.shape} ${card.color} ${card.backgroundColor}` }) : t('card_slot_empty_aria_label', { slotNumber: index + 1 })}
        >
          <div className="card-slot-number" aria-hidden="true">{index + 1}</div>
          <CardComponent
            card={card}
            isSelected={card ? selectedCards.includes(card.id) : false}
            onClick={card ? onCardClick : () => {}}
            slotNumber={index + 1} // Pass slot number for ARIA label in CardComponent if needed
          />
        </div>
      ))}
    </div>
  );
};

export default Board;

