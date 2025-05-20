import React from 'react';
import { useTranslation } from 'react-i18next';

// Define as formas como componentes SVG para melhor controle e escalabilidade
const Triangle = React.memo(({ fillStyle, color }) => {
  const strokeColor = color;
  let fill = 'none';
  let strokeWidth = 2;

  if (fillStyle === 'solid') {
    fill = color;
  } else if (fillStyle === 'striped') {
    fill = `url(#stripe-pattern-${color.replace('#', '')})`;
  }

  return (
    <svg width="60" height="52" viewBox="0 0 60 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {fillStyle === 'striped' && (
        <defs>
          <pattern id={`stripe-pattern-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <rect width="4" height="4" fill={color.replace(')', ', 0.3)').replace('rgb', 'rgba')} />
            <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: color, strokeWidth: 2 }} />
          </pattern>
        </defs>
      )}
      <path d="M30 0L60 52H0L30 0Z" fill={fill} stroke={strokeColor} strokeWidth={fillStyle === 'hollow' ? strokeWidth : (fillStyle === 'striped' ? strokeWidth : 0)} />
    </svg>
  );
});

const Square = React.memo(({ fillStyle, color }) => {
  const strokeColor = color;
  let fill = 'none';
  let strokeWidth = 2;
  if (fillStyle === 'solid') {
    fill = color;
  } else if (fillStyle === 'striped') {
    fill = `url(#stripe-pattern-${color.replace('#', '')})`;
  }
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {fillStyle === 'striped' && (
        <defs>
          <pattern id={`stripe-pattern-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <rect width="4" height="4" fill={color.replace(')', ', 0.3)').replace('rgb', 'rgba')} />
            <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: color, strokeWidth: 2 }} />
          </pattern>
        </defs>
      )}
      <rect width="50" height="50" fill={fill} stroke={strokeColor} strokeWidth={fillStyle === 'hollow' ? strokeWidth : (fillStyle === 'striped' ? strokeWidth : 0)} />
    </svg>
  );
});

const Circle = React.memo(({ fillStyle, color }) => {
  const strokeColor = color;
  let fill = 'none';
  let strokeWidth = 2;
  if (fillStyle === 'solid') {
    fill = color;
  } else if (fillStyle === 'striped') {
    fill = `url(#stripe-pattern-${color.replace('#', '')})`;
  }
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {fillStyle === 'striped' && (
        <defs>
          <pattern id={`stripe-pattern-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <rect width="4" height="4" fill={color.replace(')', ', 0.3)').replace('rgb', 'rgba')} />
            <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: color, strokeWidth: 2 }} />
          </pattern>
        </defs>
      )}
      <circle cx="25" cy="25" r="24" fill={fill} stroke={strokeColor} strokeWidth={fillStyle === 'hollow' ? strokeWidth : (fillStyle === 'striped' ? strokeWidth : 0)} />
    </svg>
  );
});

const CardComponent = React.memo(({ card, isSelected, onClick, slotNumber }) => {
  const { t } = useTranslation();
  if (!card) {
    return (
        <div 
            className="w-full h-32 md:h-40 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs md:text-sm"
            aria-label={t('card_slot_empty_aria_label', { slotNumber })}
        >
            {t('card_slot_empty_text')}
        </div>
    );
  }

  const colorHexMap = {
    green: 'rgb(52, 211, 153)', // Emerald 400
    purple: 'rgb(167, 139, 250)', // Violet 400
    orange: 'rgb(253, 186, 116)', // Orange 300
    red: 'rgb(248, 113, 113)', // Red 400
    blue: 'rgb(96, 165, 250)', // Blue 400
    yellow: 'rgb(253, 224, 71)', // Yellow 300
    cyan: "rgb(34, 211, 238)",
    pink: "rgb(244, 114, 182)",
    lime: "rgb(163, 230, 53)",
    gray: "rgb(156, 163, 175)",
    teal: "rgb(45, 212, 191)",
    indigo: "rgb(129, 140, 248)",
    default: 'rgb(156, 163, 175)' // Gray 400
  };

  const shapeColor = colorHexMap[card.color] || colorHexMap.default;
  let ShapeComponent;
  switch (card.shape) {
    case 'sun': ShapeComponent = Circle; break; // Assuming sun is circle for now
    case 'moon': ShapeComponent = Square; break; // Assuming moon is square
    case 'star': ShapeComponent = Triangle; break;
    case 'heart': ShapeComponent = Circle; break; // Placeholder, ideally a heart SVG
    default: ShapeComponent = () => <div>{t('unknown_shape')}</div>;
  }

  const fillStyle = card.backgroundColor; // Assuming card.backgroundColor is 'red', 'blue', 'yellow' which maps to fill styles
                                        // This needs to be mapped to 'solid', 'striped', 'hollow' if that's the intent
                                        // For now, using card.color for shape's fill/stroke, and card.backgroundColor for card's actual background

  const cardBgColorMap = {
    red: 'bg-red-200 dark:bg-red-700',
    blue: 'bg-blue-200 dark:bg-blue-700',
    yellow: 'bg-yellow-100 dark:bg-yellow-600',
    default: 'bg-gray-200 dark:bg-gray-700'
  };

  const borderClasses = isSelected ? 'border-4 border-yellow-400 dark:border-yellow-500 shadow-xl ring-2 ring-yellow-300 dark:ring-yellow-400 ring-offset-2 ring-offset-background' : 'border border-gray-300 dark:border-gray-600 shadow-md';
  const backgroundClass = cardBgColorMap[card.backgroundColor] || cardBgColorMap.default;
  const selectedTransformClass = isSelected ? 'scale-105' : 'hover:scale-105'; // Slightly reduced selected scale for less overlap

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick(card.id);
    }
  };

  return (
    <div
      className={`p-1 md:p-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ease-in-out transform ${selectedTransformClass} ${borderClasses} ${backgroundClass} card-reveal w-full h-full`}
      style={{ minWidth: '70px', minHeight: '100px', aspectRatio: '0.7' }} 
      onClick={() => onClick(card.id)}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={t('card_aria_label', { 
        count: card.shape, // This seems to be a mismatch, card.count is not used. Assuming shape is the primary descriptor.
        color: card.color, 
        background: card.backgroundColor, 
        shape: card.shape, 
        slot: slotNumber 
      })}
    >
      <div className="flex justify-center items-center w-full h-full p-1">
        {/* The shapes themselves are decorative, the main label is on the button */}
        <ShapeComponent fillStyle={'solid'} color={shapeColor} /> 
      </div>
    </div>
  );
});

export default CardComponent;

