'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProbabilityBar } from '../../components/ProbabilityBar';
import { ScoreMatrix } from '../../components/ScoreMatrix';
import { IndicatorPanel } from '../../components/IndicatorPanel';
import { DetailedMatch, Match } from '../../types/match';
import { Prediction } from '../../types/prediction';

type AnalysisData = DetailedMatch & Match & { prediction?: Prediction };

function MatchAnalysisContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');

  const [matchData, setMatchData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    async function fetchData() {
      try {
        // Find specific match by filtering the all matches route 
        // Or in a real app, call a specific match /api/match/:id endpoint that enriches data
        const response = await fetch('/api/matches');
        const result = await response.json();
        
        if (result.success) {
          const match = result.data.find((m: any) => m.id === matchId) || result.data[0];
          setMatchData(match);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load match analysis data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !matchData || !matchData.prediction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-red-500">
        Error loading match context.
      </div>
    );
  }

  const { prediction } = matchData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>{matchData.league}</span>
          <span className="mx-2">•</span>
          <span suppressHydrationWarning>{matchData.kickoffTime ? new Date(matchData.kickoffTime).toLocaleString() : ''}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          {matchData.homeTeamId} vs {matchData.awayTeamId}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Match Overview / Probability Bar */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6">Adjusted Match Probability</h3>
            <ProbabilityBar 
              homeWin={prediction.homeWinProbability} 
              draw={prediction.adjustedDrawProbability ?? prediction.drawProbability} 
              awayWin={prediction.awayWinProbability} 
            />
            
            <div className="mt-8 flex items-center justify-around text-center">
               <div>
                  <div className="text-sm text-gray-500 tracking-wider">HOME xG</div>
                  <div className="text-2xl font-black mt-1">{prediction.expectedGoalsHome.toFixed(2)}</div>
               </div>
               <div className="text-gray-300 dark:text-gray-600 text-3xl font-black">-</div>
               <div>
                  <div className="text-sm text-gray-500 tracking-wider">AWAY xG</div>
                  <div className="text-2xl font-black mt-1">{prediction.expectedGoalsAway.toFixed(2)}</div>
               </div>
            </div>
          </div>

          {/* Score Probability Matrix */}
          <ScoreMatrix predictionMatrix={prediction.scoreProbabilities} />

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Confidence Score */}
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md text-white">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-80">Model Confidence</h3>
            <div className="flex items-end mb-4">
              <span className="text-5xl font-black">{prediction.confidenceScore.toFixed(1)}</span>
              <span className="text-xl font-bold ml-1 opacity-80">/ 10</span>
            </div>
            <div className="w-full bg-blue-900/40 rounded-full h-2">
               <div className="bg-white h-2 rounded-full" style={{ width: `${prediction.confidenceScore * 10}%` }}></div>
            </div>
            <p className="mt-4 text-xs opacity-80">Aggregate probability score driven by active match indicators.</p>
          </div>

          {/* Value Bet Analysis */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Value Bet Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Bookmaker Draw Odds</span>
                <span className="font-mono font-bold">{matchData.odds?.draw ? matchData.odds.draw.toFixed(2) : 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Implied Probability</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {prediction.impliedProbability ? `${(prediction.impliedProbability * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Model Probability</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {prediction.adjustedDrawProbability ? `${(prediction.adjustedDrawProbability * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Value</span>
                  <span className={`text-xl font-black ${
                    prediction.valueRating === 'Strong value' ? 'text-emerald-500' :
                    prediction.valueRating === 'Good value' ? 'text-green-500' :
                    prediction.valueRating === 'Small value' ? 'text-yellow-500' :
                    'text-gray-400'
                  }`}>
                    {prediction.expectedValue !== undefined ? `${prediction.expectedValue > 0 ? '+' : ''}${(prediction.expectedValue * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className={`text-xs px-2 py-1 rounded inline-block font-bold uppercase tracking-wider ${
                    prediction.valueRating === 'Strong value' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    prediction.valueRating === 'Good value' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    prediction.valueRating === 'Small value' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {prediction.valueRating || 'No value'}
                </div>
              </div>
            </div>
          </div>

          {/* Draw Indicators */}
          <IndicatorPanel indicators={Array.isArray(prediction.indicators) ? prediction.indicators : []} />
          
          {/* H2H History Placeholder */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h3 className="text-lg font-bold mb-4">Head-to-Head History</h3>
            <div className="space-y-3">
               {(matchData.headToHead ?? []).map((h2h, idx) => (
                 <div key={`h2h-${idx}`} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                   <span className="font-semibold">{h2h.homeTeamScore} - {h2h.awayTeamScore}</span>
                   <span className="text-xs text-gray-500" suppressHydrationWarning>{new Date(h2h.date).toLocaleDateString()}</span>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function MatchAnalysisPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <MatchAnalysisContent />
    </Suspense>
  );
}
