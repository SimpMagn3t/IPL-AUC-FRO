import React, { useState } from 'react';

const PlayerDisplay = ({ players, onBid }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPlayer = players[currentIndex];

  const handleNextPlayer = () => {
    setCurrentIndex((currentIndex + 1) % players.length);
  };

  return (
    <div>
      <h3>Current Player: {currentPlayer.name}</h3>
      <p>Role: {currentPlayer.role}</p>
      <p>Base Price: ₹{currentPlayer.base_price}</p>
      <button onClick={() => onBid(currentPlayer, currentPlayer.base_price)}>
        Bid Base Price
      </button>
      <button onClick={handleNextPlayer}>Next Player</button>
    </div>
  );
};

export default PlayerDisplay;
