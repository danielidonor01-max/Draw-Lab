/**
 * Factorial calculator for Poisson denominator
 */
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Implement the Poisson probability function.
 * P(x goals) = (e^-λ * λ^x) / x!
 */
export function calculatePoissonProbability(expectedGoals: number, goals: number): number {
  const lambda = expectedGoals;
  const x = goals;
  
  const numerator = Math.exp(-lambda) * Math.pow(lambda, x);
  const denominator = factorial(x);
  
  return numerator / denominator;
}

/**
 * Generate a score matrix mapping Home Goals vs Away Goals probabilities.
 */
export function calculateScoreMatrix(homeXg: number, awayXg: number) {
  const maxGoals = 5;
  const matrix: { homeScore: number, awayScore: number, probability: number }[] = [];

  for (let h = 0; h <= maxGoals; h++) {
    const homeProb = calculatePoissonProbability(homeXg, h);
    for (let a = 0; a <= maxGoals; a++) {
      const awayProb = calculatePoissonProbability(awayXg, a);
      const jointProbability = homeProb * awayProb;
      
      matrix.push({
        homeScore: h,
        awayScore: a,
        probability: jointProbability
      });
    }
  }

  return matrix;
}

/**
 * Calculate pure draw probability from the diagonal of the matrix.
 */
export function calculateDrawProbability(scoreMatrix: { homeScore: number, awayScore: number, probability: number }[]): number {
  let drawProb = 0;
  
  for (const score of scoreMatrix) {
    if (score.homeScore === score.awayScore) {
      drawProb += score.probability;
    }
  }
  
  return drawProb;
}
