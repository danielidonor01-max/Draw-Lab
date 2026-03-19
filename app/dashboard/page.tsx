'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MatchCard } from '../../components/MatchCard';
import { DetailedMatch, Match } from '../../types/match';
import { Prediction } from '../../types/prediction';

type EnrichedMatch = Match & { prediction?: Prediction };

/** Returns a short day/date string and a time string from an ISO kickoff */
function formatKickoff(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

/** Returns a human-readable "X mins ago" / "X hrs ago" string */
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch('/api/matches');
        const result = await response.json();
        
        if (result.success) {
          setMatches(result.data);
          setLastSynced(new Date());
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('An error occurred while fetching matches.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();

    // Tick every 30 s so the "X mins ago" label stays fresh
    const ticker = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(ticker);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          Error: {error}
        </div>
      </div>
    );
  }

  const topOpportunities = matches.slice(0, 10);

  const getCategoryColor = (category?: string) => {
    if (category === 'Very High') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200';
    if (category === 'High') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200';
    if (category === 'Moderate') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
  };

  const getValueColor = (rating?: string) => {
    if (rating === 'Strong value') return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (rating === 'Good value') return 'text-green-500 font-medium';
    if (rating === 'Small value') return 'text-yellow-500';
    return 'text-gray-400 dark:text-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Daily Draw Finder Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Daily Draw Finder
            </h2>
            <p className="text-sm text-gray-500 mt-1">Top {topOpportunities.length} highest-rated draw opportunities computed from global fixtures today.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Opp Rank</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kickoff</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Draw Odds</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Model vs Implied</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Value</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Opportunity Score</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topOpportunities.map((match, index) => (
                  <tr key={`opp-${match.id}`} className={`transition-colors ${match.prediction?.expectedValue && match.prediction.expectedValue > 0.05 ? 'bg-green-50/30 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-sm">
                         {index + 1}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                        {match.homeTeamId} <span className="text-xs text-gray-400 font-normal mx-1">vs</span> {match.awayTeamId}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{match.league}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatKickoff(match.kickoffTime).date}</div>
                      <div className="text-xs text-blue-500 font-semibold mt-0.5">{formatKickoff(match.kickoffTime).time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <div className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                         {match.odds?.draw ? match.odds.draw.toFixed(2) : '-'}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                       <div className="flex items-center justify-center space-x-2">
                         <span className="font-mono font-bold text-blue-600 dark:text-blue-400" title="DrawLab Adjusted Model Probability">
                           {match.prediction?.adjustedDrawProbability ? `${(match.prediction.adjustedDrawProbability * 100).toFixed(1)}%` : '-'}
                         </span>
                         <span className="text-gray-400 text-xs">vs</span>
                         <span className="font-mono text-gray-500 dark:text-gray-400" title="Bookmaker Implied Probability">
                           {match.prediction?.impliedProbability ? `${(match.prediction.impliedProbability * 100).toFixed(1)}%` : '-'}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <div className={`flex flex-col items-center ${getValueColor(match.prediction?.valueRating)}`}>
                         <span className="font-mono font-bold text-sm">
                           {match.prediction?.expectedValue !== undefined ? `${match.prediction.expectedValue > 0 ? '+' : ''}${(match.prediction.expectedValue * 100).toFixed(1)}%` : '-'}
                         </span>
                         <span className="text-[10px] uppercase font-semibold mt-0.5">
                           {match.prediction?.valueRating || 'No value'}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-gray-900 dark:text-white">{(match.prediction?.opportunityScore || 0).toFixed(1)}</span>
                        <div className={`mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getCategoryColor(match.prediction?.opportunityCategory)}`}>
                          {match.prediction?.opportunityCategory || 'Low'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/match-analysis?id=${match.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Analyze</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Primary Fixtures Schedule */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Fixtures Database</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Global match directory backing the Finder models.</p>
          </div>
          {lastSynced && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
              Data loaded&nbsp;<span className="font-semibold text-gray-600 dark:text-gray-300" suppressHydrationWarning>{timeAgo(lastSynced)}</span>
            </div>
          )}
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Match
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  League
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kickoff
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Raw Draw
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Adj. Draw
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {match.homeTeamId} vs {match.awayTeamId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {match.league}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatKickoff(match.kickoffTime).date}</div>
                    <div className="text-xs text-blue-500 font-semibold mt-0.5">{formatKickoff(match.kickoffTime).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {match.prediction ? `${(match.prediction.drawProbability * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {match.prediction?.adjustedDrawProbability ? `${(match.prediction.adjustedDrawProbability * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                       <span className="font-bold text-gray-900 dark:text-white">{(match.prediction?.confidenceScore || 0).toFixed(1)}</span>
                       <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                         <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(match.prediction?.confidenceScore || 0) * 10}%` }}></div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/match-analysis?id=${match.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Analyze
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      </section>
      
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {matches.slice(0, 3).map(match => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
