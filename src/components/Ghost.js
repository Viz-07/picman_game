import React from 'react';

const Ghost = ({ x, y, image }) => {
  // Position Ghost using absolute positioning
  const size = 20; // tile size in px (should match Maze)
  return (
    <div
      className="ghost"
      style={{
        position: 'absolute',
        top: y * size,
        left: x * size,
        width: size,
        height: size
      }}
    >
      {/* Placeholder Ghost image */}
      <img src={image} alt="Ghost" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Ghost;
