import React from 'react';

interface ScoreMatrixProps {
  predictionMatrix?: { homeScore: number, awayScore: number, probability: number }[];
}

export const ScoreMatrix: React.FC<ScoreMatrixProps> = ({ predictionMatrix }) => {
  const scores = [0, 1, 2, 3, 4, 5];
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4">Score Probability Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 border-r dark:border-gray-700">H \ A</th>
              {scores.map(s => <th key={s} className="px-4 py-3">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {scores.map(homeScore => (
              <tr key={homeScore} className="border-b dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-700">
                  {homeScore}
                </th>
                {scores.map(awayScore => {
                  const isDraw = homeScore === awayScore;
                  const probObj = predictionMatrix?.find(p => p.homeScore === homeScore && p.awayScore === awayScore);
                  const probabilityPercent = probObj ? (probObj.probability * 100).toFixed(1) + '%' : '--%';
                  
                  return (
                    <td key={`${homeScore}-${awayScore}`} className={`px-4 py-3 ${isDraw ? 'bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                      {probabilityPercent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

