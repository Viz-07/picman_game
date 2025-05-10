import React from 'react';

const WinScreen = ({ score, onRestart }) => {
  return (
    <div className="win-screen">
      <h1>You Win!</h1>
      <p>Your Score: {score}</p>
      <button onClick={onRestart}>Play Again</button>
    </div>
  );
};

export default WinScreen;
