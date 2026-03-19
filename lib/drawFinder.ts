import { Prediction } from '../types/prediction';
import { Match, DetailedMatch } from '../types/match';

/**
 * Calculates a unified opportunity score to rank the best draw candidates.
 * Formula: (Adjusted Draw Probability * 0.6) + (Confidence Score * 4)
 * Returns a normalized 0-10 score.
 */
export function calculateOpportunityScore(
  adjustedDrawProbability: number,
  confidenceScore: number,
  expectedValue?: number
): number {
  
  let rawScore = ((adjustedDrawProbability * 100) * 0.6) + (confidenceScore * 4);
  
  // Phase 6 Integration: Boost opportunity if positive Value Bet detected
  if (expectedValue !== undefined && expectedValue > 0) {
    // A 10% EV (+0.1) adds 5 raw points — meaningful boost without dominating the score
    rawScore += (expectedValue * 50);
  }

  const normalizedScore = Number((rawScore / 10).toFixed(1));

  // Cap at 10.0
  return Math.min(10.0, Math.max(0.0, normalizedScore));
}

/**
 * Categorizes the numerical opportunity score into descriptive buckets.
 */
export function categorizeOpportunity(score: number): 'Very High' | 'High' | 'Moderate' | 'Low' {
  if (score >= 8.5) return 'Very High';
  if (score >= 7.5) return 'High';
  if (score >= 6.5) return 'Moderate';
  return 'Low';
}

/**
 * Takes an array of enriched matches, sorts them by opportunity score descending,
 * and returns the top requested elements.
 */
export function rankMatches(
  matches: (Match & { prediction?: Prediction })[],
  limit: number = 10
) {
  return [...matches]
    .filter(m => m.prediction?.opportunityScore !== undefined)
    .sort((a, b) => {
      const scoreA = a.prediction!.opportunityScore!;
      const scoreB = b.prediction!.opportunityScore!;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
