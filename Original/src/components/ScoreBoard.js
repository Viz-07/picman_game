import React from 'react';

const ScoreBoard = ({ score, lives, level }) => {
  return (
    <div className="scoreboard" style={{ margin: '10px', color: 'white', fontSize: '18px' }}>
      <span>Score: {score}</span> | <span>Lives: {lives}</span> | <span>Level: {level}</span>
    </div>
  );
};

export default ScoreBoard;
