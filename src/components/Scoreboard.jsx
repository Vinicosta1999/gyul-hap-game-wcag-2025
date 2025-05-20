import React from 'react';

const Scoreboard = ({ round, player1Score, player2Score }) => {
  return (
    <div className="p-4 bg-gray-200 rounded-lg shadow-md mb-4 text-center">
      <h2 className="text-xl font-bold mb-2">Round: {round} / 10</h2>
      <div className="flex justify-around">
        <p className="text-lg">Player 1: {player1Score}</p>
        <p className="text-lg">Player 2: {player2Score}</p>
      </div>
    </div>
  );
};

export default Scoreboard;

