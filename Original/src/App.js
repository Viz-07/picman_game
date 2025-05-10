import React, { useState, useEffect, useRef } from 'react';
import Maze from './components/Maze';
import PacMan from './components/PacMan';
import Ghost from './components/Ghost';
import ScoreBoard from './components/ScoreBoard';
import GameOver from './components/GameOver';
import WinScreen from './components/WinScreen';

// Import placeholder images
import pacmanImage from './assets/pacman.png';
import ghostImage1 from './assets/ghost1.png';
import ghostImage2 from './assets/ghost2.png';
import wallImage from './assets/wall.png';    
import pelletImage from './assets/pellet.png';

// Define tile types
const WALL = 0;
const PELLET = 1;
const EMPTY = 2;

// Game levels with basic map layouts and initial positions
const levels = [
  {
    map: [
      [0,0,0,0,0,0,0],
      [0,1,1,1,1,1,0],
      [0,1,0,0,0,1,0],
      [0,1,0,1,0,1,0],
      [0,1,0,1,1,1,0],
      [0,1,0,0,0,1,0],
      [0,1,1,1,1,1,0],
      [0,0,0,0,0,0,0]
    ],
    pacmanStart: { x: 1, y: 1 },
    ghostsStart: [
      { x: 5, y: 5, dx: -1, dy: 0, image: ghostImage1 }
    ]
  },
  {
    map: [
      [0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,0,0,1,0],
      [0,1,0,1,0,1,1,0],
      [0,1,0,1,0,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0]
    ],
    pacmanStart: { x: 1, y: 1 },
    ghostsStart: [
      { x: 6, y: 1, dx: -1, dy: 0, image: ghostImage1 },
      { x: 6, y: 4, dx: 0, dy: -1, image: ghostImage2 }
    ]
  }
];

function App() {
  // Game state
  const [level, setLevel] = useState(0);
  const [mapData, setMapData] = useState([]);
  const [pacmanPos, setPacmanPos] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [ghosts, setGhosts] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStatus, setGameStatus] = useState("playing"); // "playing", "gameover", "win"

  // Use a ref to keep track of Pac-Man position inside callbacks
  const pacmanRef = useRef(pacmanPos);
  useEffect(() => {
    pacmanRef.current = pacmanPos;
  }, [pacmanPos]);

  // Initialize level data when level changes
  useEffect(() => {
    const levelData = levels[level];
    // Deep copy map for pellet reset
    const newMap = levelData.map.map(row => [...row]);
    setMapData(newMap);
    setPacmanPos({ ...levelData.pacmanStart });
    setDirection({ x: 0, y: 0 });
    setGhosts(levelData.ghostsStart.map(g => ({ ...g })));
  }, [level]);

  // Handle keyboard input for Pac-Man
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== "playing") return;
      let newDir = null;
      if (e.key === "ArrowUp")    newDir = { x: 0, y: -1 };
      if (e.key === "ArrowDown")  newDir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft")  newDir = { x: -1, y: 0 };
      if (e.key === "ArrowRight") newDir = { x: 1, y: 0 };
      if (newDir) {
        setDirection(newDir);
        tryMove(newDir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pacmanPos, mapData, gameStatus]);

  // Move Pac-Man based on direction vector
  const tryMove = ({ x: dx, y: dy }) => {
    if (gameStatus !== "playing") return;
    const newX = pacmanPos.x + dx;
    const newY = pacmanPos.y + dy;
    // Check bounds and wall collision
    if (
      newY >= 0 && newY < mapData.length &&
      newX >= 0 && newX < mapData[0].length &&
      mapData[newY][newX] !== WALL
    ) {
      // Move Pac-Man
      setPacmanPos({ x: newX, y: newY });
      // Eat pellet if present
      if (mapData[newY][newX] === PELLET) {
        const newMap = mapData.map(row => [...row]);
        newMap[newY][newX] = EMPTY;
        setMapData(newMap);
        setScore(prev => prev + 10);
      }
      // Check collision with any ghost
      ghosts.forEach(ghost => {
        if (ghost.x === newX && ghost.y === newY) {
          handleCollision();
        }
      });
      // Check win condition (no pellets left)
      if (!mapData.flat().includes(PELLET)) {
        if (level < levels.length - 1) {
          setLevel(level + 1);
        } else {
          setGameStatus("win");
        }
      }
    }
  };

  // Continuous movement for Pac-Man
  useEffect(() => {
    if (direction.x === 0 && direction.y === 0) return;
    const interval = setInterval(() => {
      tryMove(direction);
    }, 200); // Pac-Man speed (ms)
    return () => clearInterval(interval);
  }, [direction, pacmanPos, mapData, ghosts, gameStatus]);

  // Ghost movement logic
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const interval = setInterval(() => {
      setGhosts(prevGhosts => {
        let collision = false;
        const newGhosts = prevGhosts.map(g => {
          let { x, y, dx, dy, image } = g;
          // Possible directions: up, down, left, right (avoid reversing)
          const options = [];
          if (mapData[y - 1] && mapData[y - 1][x] !== WALL && dy !== 1) options.push({ x: 0, y: -1 });
          if (mapData[y + 1] && mapData[y + 1][x] !== WALL && dy !== -1) options.push({ x: 0, y: 1 });
          if (mapData[y][x - 1] !== undefined && mapData[y][x - 1] !== WALL && dx !== 1) options.push({ x: -1, y: 0 });
          if (mapData[y][x + 1] !== undefined && mapData[y][x + 1] !== WALL && dx !== -1) options.push({ x: 1, y: 0 });
          // If forward direction is blocked or at random, pick new direction
          const forwardBlocked = (mapData[y + dy]?.[x + dx] === WALL);
          if (forwardBlocked || Math.random() < 0.3) {
            if (options.length > 0) {
              const newDir = options[Math.floor(Math.random() * options.length)];
              dx = newDir.x;
              dy = newDir.y;
            }
          }
          // Move ghost
          const newX = x + dx;
          const newY = y + dy;
          if (mapData[newY] && mapData[newY][newX] !== WALL) {
            x = newX;
            y = newY;
          }
          // Check collision with Pac-Man
          if (x === pacmanRef.current.x && y === pacmanRef.current.y) {
            collision = true;
          }
          return { x, y, dx, dy, image };
        });
        if (collision) handleCollision();
        return newGhosts;
      });
    }, 500); // Ghost speed (ms)
    return () => clearInterval(interval);
  }, [gameStatus, mapData]);

  // Handle Pac-Man collision with a ghost
  const handleCollision = () => {
    if (gameStatus !== "playing") return;
    if (lives > 1) {
      setLives(prev => prev - 1);
      // Reset positions for current level
      const levelData = levels[level];
      setPacmanPos({ ...levelData.pacmanStart });
      setDirection({ x: 0, y: 0 });
      setGhosts(levelData.ghostsStart.map(g => ({ ...g })));
    } else {
      setGameStatus("gameover");
    }
  };

  // Restart game
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(0);
    setGameStatus("playing");
  };

  // Render components or end screens
  if (gameStatus === "gameover") {
    return <GameOver score={score} onRestart={resetGame} />;
  }
  if (gameStatus === "win") {
    return <WinScreen score={score} onRestart={resetGame} />;
  }
  if (!mapData || mapData.length === 0 || !mapData[0]) {
  return <div>Loading game...</div>;
  }
  
  return (
    <div>
      <ScoreBoard score={score} lives={lives} level={level + 1} />
      <div
        className="game-container"
        style={{
          position: 'relative',
          width: `${mapData[0]?.length * 20}px`,
          height: `${mapData.length * 20}px`
        }}
      >
        <Maze map={mapData} wallImage={wallImage} pelletImage={pelletImage} />
        <PacMan x={pacmanPos.x} y={pacmanPos.y} image={pacmanImage} />
        {ghosts.map((g, idx) => (
          <Ghost key={idx} x={g.x} y={g.y} image={g.image} />
        ))}
      </div>
    </div>
  );
}

export default App;
