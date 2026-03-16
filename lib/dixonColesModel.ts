/**
 * Module representing the Dixon-Coles adjustment to the basic Poisson football model.
 * It corrects the under-estimation of low-scoring draws explicitly matching the paper's
 * tau formulas.
 */

// Define the baseline tau function to modify the independent probabilities
function calculateTau(homeScore: number, awayScore: number, homeXg: number, awayXg: number, rho: number): number {
  if (homeScore === 0 && awayScore === 0) {
    return 1 - (homeXg * awayXg * rho);
  }
  if (homeScore === 0 && awayScore === 1) {
    return 1 + (homeXg * rho);
  }
  if (homeScore === 1 && awayScore === 0) {
    return 1 + (awayXg * rho);
  }
  if (homeScore === 1 && awayScore === 1) {
    return 1 - rho;
  }
  return 1;
}

/**
 * Normalizes a probability matrix so its sum equals 1.0 exactly.
 */
function normalizeMatrix(matrix: { homeScore: number, awayScore: number, probability: number }[]) {
  const sum = matrix.reduce((acc, curr) => acc + curr.probability, 0);
  if (sum === 0) return matrix;
  
  return matrix.map(score => ({
    ...score,
    probability: score.probability / sum
  }));
}

/**
 * Apply the Dixon-Coles adjustment to raw Poisson probabilities.
 * @param poissonMatrix Raw score probability matrix
 * @param homeXg Home expected goals
 * @param awayXg Away expected goals
 * @param rho Dixon-Coles dependence parameter (typically -0.1 to -0.2)
 */
export function applyDixonColes(
  poissonMatrix: { homeScore: number, awayScore: number, probability: number }[],
  homeXg: number,
  awayXg: number,
  rho: number = -0.15
): { homeScore: number, awayScore: number, probability: number }[] {
  
  // Apply tau correction to specific scorelines
  const adjustedMatrix = poissonMatrix.map(score => {
    const tau = calculateTau(score.homeScore, score.awayScore, homeXg, awayXg, rho);
    // Prevent negative probabilities from extreme rho choices
    const newProb = Math.max(0, score.probability * tau); 
    
    return {
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      probability: newProb
    };
  });

  // Re-normalize altered map to sum exactly to 1.0
  return normalizeMatrix(adjustedMatrix);
}
