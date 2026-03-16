import React from 'react';
import { Match } from '../types/match';
import { Prediction } from '../types/prediction';

type EnrichedMatch = Match & { prediction?: Prediction };

interface MatchCardProps {
  match: EnrichedMatch;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{match.league}</span>
        <span className="text-xs text-gray-400">{new Date(match.kickoffTime).toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center text-lg font-bold">
            {match.homeTeamId.substring(0, 3).toUpperCase()}
          </div>
          <span className="font-semibold text-center text-sm">{match.homeTeamId}</span>
        </div>
        <div className="px-4 text-center">
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {match.status === 'FINISHED' ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
          </div>
          {match.drawProbability !== undefined && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <div className="text-[10px] font-medium text-gray-500 uppercase">Draw</div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                Raw: {(match.drawProbability * 100).toFixed(0)}%
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                Adj: {(match.prediction?.adjustedDrawProbability ?? match.drawProbability * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center text-lg font-bold">
            {match.awayTeamId.substring(0, 3).toUpperCase()}
          </div>
          <span className="font-semibold text-center text-sm">{match.awayTeamId}</span>
        </div>
      </div>
    </div>
  );
};
