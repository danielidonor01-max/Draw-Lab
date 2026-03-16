export interface Prediction {
  matchId: string;
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  adjustedDrawProbability?: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  scoreProbabilities: {
    homeScore: number;
    awayScore: number;
    probability: number;
  }[];
  indicators: string[]; // key indicators for draw e.g. "Low scoring history", "similar xG"
  indicatorDetails?: IndicatorScore[];
  confidenceScore: number;
  opportunityScore?: number;
  opportunityCategory?: 'Very High' | 'High' | 'Moderate' | 'Low';
  
  // Value Betting Parameters
  impliedProbability?: number;
  expectedValue?: number;
  valueRating?: 'Strong value' | 'Good value' | 'Small value' | 'No value';
}

export interface IndicatorScore {
  name: string;
  description: string;
  score: number; // 0 to 10 scale
}
