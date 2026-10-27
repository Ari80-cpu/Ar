import React from 'react';

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  showText?: boolean;
  className?: string;
}

// Code 39 character patterns (each character is 9 bars: 3 wide (2) and 6 narrow (1))
const CODE39_MAP: Record<string, string> = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
};

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 48,
  width = 200,
  showText = true,
  className = ''
}) => {
  // Uppercase value and wrap with asterisk start/stop markers
  const cleanVal = (value || '0000').toUpperCase();
  const fullVal = `*${cleanVal}*`;

  let bitString = '';
  for (let i = 0; i < fullVal.length; i++) {
    const char = fullVal[i];
    const bits = CODE39_MAP[char] || CODE39_MAP['0'];
    bitString += bits + '0'; // inter-character gap
  }

  const barCount = bitString.length;
  const barWidth = width / barCount;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {bitString.split('').map((bit, idx) => {
          if (bit === '1') {
            return (
              <rect
                key={idx}
                x={idx * barWidth}
                y={0}
                width={Math.max(1, barWidth)}
                height={height}
                fill="#0f172a"
              />
            );
          }
          return null;
        })}
      </svg>
      {showText && (
        <span className="mt-1 font-mono text-[11px] font-medium tracking-[0.2em] text-slate-700 tabular-nums">
          {cleanVal}
        </span>
      )}
    </div>
  );
};
