'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    // No match ID — show the empty state immediately
    if (!matchId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Try dedicated single-match route first
        let response = await fetch(`/api/matches/${matchId}`);
        
        // Fallback: If dedicated route 404s, try fetching all matches and filtering locally
        if (response.status === 404) {
          console.warn('Dedicated match route 404d, falling back to all-matches fetch...');
          const allResponse = await fetch('/api/matches');
          if (allResponse.ok) {
            const allData = await allResponse.json();
            const foundMatch = allData.data?.find((m: any) => m.id === matchId);
            
            if (foundMatch) {
              setMatchData(foundMatch);
              setLoading(false);
              return;
            }
          }
        }

        if (!response.ok) {
          throw new Error('Failed to fetch match data');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setMatchData(data.data);
        } else {
          setError('Match not found');
        }
      } catch (err) {
        console.error('Error fetching match:', err);
        setError('Failed to load match analysis. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ── No match selected ──────────────────────────────────────────────────────
  if (!matchId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">No match selected</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Select a fixture from the Dashboard to load the full statistical analysis.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !matchData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          {error || 'Match data unavailable.'}
        </div>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── No prediction yet ──────────────────────────────────────────────────────
  if (!matchData.prediction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-xl">
          Prediction data is not yet available for this match. It will be computed on the next cron sync.
        </div>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { prediction } = matchData;
  const headToHead = Array.isArray(matchData.headToHead) ? matchData.headToHead : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span className="mx-2">›</span>
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
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                <div className={`text-xs px-2 py-1 rounded inline-block font-bold uppercase trac\';l,ng-wider ${
                    prediction.valueRating === 'Strong value' ? 'bg-emerald-100 text-emerald-800\';l,ark:bg-emerald-900/30 dark:text-emerald-400' :
                    prediction.valueRating === 'Good value' ? 'bg-green-100 text-green-800 dark:\';l,-green-900/30 dark:text-green-400' :
                    prediction.valueRating === 'Small value' ? 'bg-yellow-100 text-yellow-800 da\';l,:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {prediction.valueRating || 'No value'}
                </div>
              </div>
            </div>
          </div>

          {/* Draw Indicators */}
          <IndicatorPanel indicators={Array.isArray(prediction.indicators) ? prediction.indicators : []} />

          {/* H2H History */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h3 className="text-lg font-bold mb-4">Head-to-Head History</h3>
            {headToHead.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No head-to-head history available for this fixture.</p>
            ) : (
              <div className="space-y-3">
                {headToHead.map((h2h: any, idx: number) => (
                  <div key={`h2h-${idx}`} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="font-semibold">{h2h.homeTeamScore} - {h2h.awayTeamScore}</span>
                    <span className="text-xs text-gray-400">{h2h.competition}</span>
                    <span className="text-xs text-gray-500" suppressHydrationWarning>{new Date(h2h.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
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
