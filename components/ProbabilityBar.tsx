import React from 'react';

interface ProbabilityBarProps {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({ homeWin, draw, awayWin }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
        <span>Home ({(homeWin * 100).toFixed(0)}%)</span>
        <span className="text-blue-600 font-bold">Draw ({(draw * 100).toFixed(0)}%)</span>
        <span>Away ({(awayWin * 100).toFixed(0)}%)</span>
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full flex overflow-hidden">
        <div style={{ width: `${homeWin * 100}%` }} className="bg-gray-400"></div>
        <div style={{ width: `${draw * 100}%` }} className="bg-blue-500"></div>
        <div style={{ width: `${awayWin * 100}%` }} className="bg-gray-800"></div>
      </div>
    </div>
  );
};
