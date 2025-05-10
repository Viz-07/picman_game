import React from 'react';

const WALL = 0;
const PELLET = 1;

const Maze = ({ map, wallImage, pelletImage }) => {
  if (!map || map.length === 0 || !map[0]) {
    return <div>Loading maze...</div>; // Prevent crash
  }

  const cols = map[0].length;

  return (
    <div
      className="maze"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 20px)`
      }}
    >
      {map.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (cell === WALL) {
            return (
              <div className="cell" key={`${rowIndex}-${colIndex}`}>
                <img
                  src={wallImage}
                  alt="Wall"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          }
          if (cell === PELLET) {
            return (
              <div className="cell" key={`${rowIndex}-${colIndex}`}>
                <img
                  src={pelletImage}
                  alt="Pellet"
                  style={{
                    width: '6px',
                    height: '6px',
                    margin: 'auto',
                    display: 'block',
                    marginTop: '7px'
                  }}
                />
              </div>
            );
          }
          return <div className="cell" key={`${rowIndex}-${colIndex}`} />;
        })
      )}
    </div>
  );
};

export default Maze;
