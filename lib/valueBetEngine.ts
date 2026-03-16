/**
 * Implements the Value Bet detection logic mapping adjusted draw probabilities against bookmaker odds. 
 */

export type ValueRating = 'Strong value' | 'Good value' | 'Small value' | 'No value';

export interface ValueBetResult {
  impliedProbability: number;
  expectedValue: number;
  valueRating: ValueRating;
}

/**
 * Calculates Expected Value (EV) by contrasting the DrawLab probability with real bookmaker odds.
 * EV = (modelProbability * odds) - 1
 */
export function calculateValueBet(modelDrawProbability: number, drawOdds: number): ValueBetResult {
  if (!drawOdds || drawOdds <= 0) {
    return {
      impliedProbability: 0,
      expectedValue: 0,
      valueRating: 'No value'
    };
  }

  // 1. Calculate bookmaker's implied probability (1 / decimal_odds)
  const impliedProbability = 1 / drawOdds;

  // 2. Calculate the Expected Value
  // E.g., if our model says 33% (0.33) and the odds are 3.50 (implies 28.5%). 
  // EV = (0.33 * 3.50) - 1 = 1.155 - 1 = 0.155 (15.5% Edge)
  const expectedValue = (modelDrawProbability * drawOdds) - 1;

  // 3. Determine Rating Tier
  let valueRating: ValueRating = 'No value';
  
  if (expectedValue > 0.10) {
    valueRating = 'Strong value';
  } else if (expectedValue > 0.05) {
    valueRating = 'Good value';
  } else if (expectedValue > 0.0) {
    valueRating = 'Small value';
  }

  return {
    impliedProbability,
    expectedValue,
    valueRating
  };
}
