import React from 'react';

const PacMan = ({ x, y, image }) => {
  // Position Pac-Man using absolute positioning
  const size = 20; // tile size in px (should match Maze)
  return (
    <div
      className="pacman"
      style={{
        position: 'absolute',
        top: y * size,
        left: x * size,
        width: size,
        height: size
      }}
    >
      {/* Placeholder Pac-Man image */}
      <img src={image} alt="Pac-Man" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PacMan;
