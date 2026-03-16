import { DetailedMatch, Match } from '../types/match';
import { Prediction } from '../types/prediction';
import { calculateExpectedGoals } from './xgModel';
import { calculateScoreMatrix, calculateDrawProbability } from './poissonModel';
import { calculateDrawIndicators } from './drawIndicators';
import { applyDixonColes } from './dixonColesModel';
import { calculateOpportunityScore, categorizeOpportunity } from './drawFinder';
import { calculateValueBet } from './valueBetEngine';

/**
 * Main engine processing function.
 * Takes a DetailedMatch object and produces a statistical prediction.
 */
export function calculatePrediction(match: DetailedMatch): Prediction {
  
  // 1. Calculate Expected Goals (xG)
  const { homeXG, awayXG } = calculateExpectedGoals(
    match.homeTeamStats, 
    match.awayTeamStats, 
    match.leagueAverages
  );

  // 2. Generate Base Poisson Score Probability Matrix
  const baseMatrix = calculateScoreMatrix(homeXG, awayXG);
  const baseDrawProbability = calculateDrawProbability(baseMatrix);

  // 3. Apply Dixon-Coles Low-Score Correction
  const dixonColesMatrix = applyDixonColes(baseMatrix, homeXG, awayXG, -0.15);
  const adjustedDrawProbability = calculateDrawProbability(dixonColesMatrix);
  
  // 4. Calculate Final Win Discrepancies
  let homeWinProbability = 0;
  let awayWinProbability = 0;
  
  for (const score of dixonColesMatrix) {
    if (score.homeScore > score.awayScore) {
      homeWinProbability += score.probability;
    } else if (score.awayScore > score.homeScore) {
      awayWinProbability += score.probability;
    }
  }

  // 5. Calculate Draw Indicators and Confidence Score
  const indicatorResult = calculateDrawIndicators(
    match.homeTeamStats,
    match.awayTeamStats,
    homeXG,
    awayXG,
    match.leagueAverages
  );

  // 6. Value Bet Detection (Uses Mock Odds if present)
  let valueBetMetrics = {};
  if (match.odds) {
    valueBetMetrics = calculateValueBet(adjustedDrawProbability, match.odds.draw);
  }

  // 7. Calculate Opportunity Scores
  const opportunityScore = calculateOpportunityScore(
    adjustedDrawProbability, 
    indicatorResult.confidenceScore, 
    (valueBetMetrics as any)?.expectedValue
  );
  const opportunityCategory = categorizeOpportunity(opportunityScore);

  // Return the comprehensive Prediction object
  return {
    matchId: match.id,
    homeWinProbability,
    awayWinProbability,
    drawProbability: baseDrawProbability,
    adjustedDrawProbability,
    expectedGoalsHome: homeXG,
    expectedGoalsAway: awayXG,
    scoreProbabilities: dixonColesMatrix,
    indicators: indicatorResult.indicators,
    indicatorDetails: indicatorResult.indicatorDetails,
    confidenceScore: indicatorResult.confidenceScore,
    opportunityScore,
    opportunityCategory,
    ...valueBetMetrics
  };
}

/**
 * Utility adapter to attach prediction logic to simple Match structures
 */
export function enrichMatchWithPrediction(match: DetailedMatch): Match & { prediction?: Prediction } {
  const prediction = calculatePrediction(match);
  
  return {
    id: match.id,
    homeTeamId: match.homeTeam,
    awayTeamId: match.awayTeam,
    league: match.league,
    season: match.season,
    kickoffTime: match.kickoff,
    status: 'SCHEDULED', // Mock status
    drawProbability: prediction.drawProbability,
    confidenceScore: prediction.confidenceScore,
    prediction
  };
}
