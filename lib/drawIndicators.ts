import { TeamStats, LeagueAverages } from '../types/match';
import { IndicatorScore } from '../types/prediction';

/**
 * Calculates a 0-10 confidence score for a draw based on multiple contextual indicators.
 */
export function calculateDrawIndicators(
  homeStats: TeamStats,
  awayStats: TeamStats,
  homeXg: number,
  awayXg: number,
  leagueAverages: LeagueAverages
): { confidenceScore: number, indicatorDetails: IndicatorScore[], indicators: string[] } {
  
  const details: IndicatorScore[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 1. Team Strength Balance (Weight: 3)
  const xgDiff = Math.abs(homeXg - awayXg);
  let strengthScore = 0;
  if (xgDiff < 0.15) strengthScore = 10;
  else if (xgDiff < 0.35) strengthScore = 7;
  else if (xgDiff < 0.60) strengthScore = 3;
  
  details.push({
    name: "Team Strength Balance",
    description: `Matchup xG difference is ${xgDiff.toFixed(2)}`,
    score: strengthScore
  });
  totalScore += (strengthScore * 3);
  maxPossibleScore += (10 * 3);

  // 2. Low Scoring Profile (Weight: 3)
  const totalXg = homeXg + awayXg;
  let lowScoringScore = 0;
  if (totalXg < 2.0) lowScoringScore = 10;
  else if (totalXg < 2.4) lowScoringScore = 7;
  else if (totalXg < 2.8) lowScoringScore = 4;
  
  details.push({
    name: "Low Scoring Profile",
    description: `Combined expected goals is ${totalXg.toFixed(2)}`,
    score: lowScoringScore
  });
  totalScore += (lowScoringScore * 3);
  maxPossibleScore += (10 * 3);

  // 3. Draw Frequency (Weight: 2)
  // Parse dynamic live statistics from API payload
  const homeDrawRate = homeStats.totalMatchesPlayed > 0 ? (homeStats.numberOfDraws / homeStats.totalMatchesPlayed) : 0.25;
  const awayDrawRate = awayStats.totalMatchesPlayed > 0 ? (awayStats.numberOfDraws / awayStats.totalMatchesPlayed) : 0.25;
  
  let drawFreqScore = 0;
  if (homeDrawRate > 0.28 && awayDrawRate > 0.28) drawFreqScore = 10;
  else if (homeDrawRate > 0.25 && awayDrawRate > 0.25) drawFreqScore = 8;
  else if (homeDrawRate > 0.22 || awayDrawRate > 0.22) drawFreqScore = 5;

  details.push({
    name: "Historical Draw Frequency",
    description: `Home draw rate: ${(homeDrawRate*100).toFixed(1)}%, Away: ${(awayDrawRate*100).toFixed(1)}%`,
    score: drawFreqScore
  });
  totalScore += (drawFreqScore * 2);
  maxPossibleScore += (10 * 2);

  // 4. Form Similarity (Weight: 1)
  // Form similarity assumes closely matched teams based on xG difference
  let formScore = 0;
  if (xgDiff < 0.2) formScore = 8;
  else if (xgDiff < 0.4) formScore = 5;

  details.push({
    name: "Form Capability Similarity",
    description: "Evaluated capability index based on expected goals margin",
    score: formScore
  });
  totalScore += (formScore * 1);
  maxPossibleScore += (10 * 1);

  // 5. League Draw Rate (Weight: 1)
  // Derive abstract draw rate from average goals vs standard baselines
  const leagueDrawAvg = 0.24; // Baseline constant assumption for football
  let leagueScore = 5;
  if (leagueAverages.averageGoalsPerMatch < 2.5) leagueScore = 8; // Lower scoring leagues have more draws
  
  details.push({
    name: "League Draw Context",
    description: `League average goals: ${(leagueAverages.averageGoalsPerMatch).toFixed(2)}`,
    score: leagueScore
  });
  totalScore += (leagueScore * 1);
  maxPossibleScore += (10 * 1);

  // Final Aggregation
  // Calculate weighted average out of 10
  const normalizedConfidenceScore = Number(((totalScore / maxPossibleScore) * 10).toFixed(1));

  // Extract simple string array for legacy/components
  const indicatorsStrings = details
    .filter(d => d.score >= 6) // Only show the positive indicators
    .map(d => `${d.name}: ${d.description}`);

  // Fallback if no strong signals found
  if (indicatorsStrings.length === 0) {
    indicatorsStrings.push("No strong contextual draw indicators found.");
  }

  return {
    confidenceScore: normalizedConfidenceScore,
    indicatorDetails: details,
    indicators: indicatorsStrings
  };
}
