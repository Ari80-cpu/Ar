import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic vector QR code rendering with standard corner alignment markers
 */
export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 110,
  className = ''
}) => {
  // Generate a 21x21 grid for Version 1 QR
  const gridSize = 21;
  const grid: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  // Helper to draw standard 7x7 finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          x === 0 || x === 6 || y === 0 || y === 6 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        ) {
          grid[startY + y][startX + x] = true;
        }
      }
    }
  };

  // Top-left, top-right, bottom-left finders
  drawFinder(0, 0);
  drawFinder(gridSize - 7, 0);
  drawFinder(0, gridSize - 7);

  // Timing lines
  for (let i = 8; i < gridSize - 8; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true;
      grid[i][6] = true;
    }
  }

  // Hash-based deterministic fill for data areas
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Skip finder zones
      const inTopLeft = x < 8 && y < 8;
      const inTopRight = x >= gridSize - 8 && y < 8;
      const inBottomLeft = x < 8 && y >= gridSize - 8;
      const inTiming = x === 6 || y === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const seed = Math.sin(hash * 0.01 + x * 13 + y * 17) * 10000;
        const pseudoRand = seed - Math.floor(seed);
        grid[y][x] = pseudoRand > 0.45;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className={`inline-block p-1.5 bg-white rounded-md shadow-xs ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {grid.map((row, y) =>
          row.map((cell, x) => {
            if (cell) {
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize + 0.1}
                  height={cellSize + 0.1}
                  fill="#0f172a"
                />
              );
            }
            return null;
          })
        )}
      </svg>
    </div>
  );
};
