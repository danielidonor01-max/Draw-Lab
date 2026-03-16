import { Match } from '../types/match';

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export class OddsService {
  /**
   * Mocks fetching bookmaker odds for a given match.
   * Generates realistic, balanced decimal odds ranging from heavy favorites (1.2) to long shots (6.0+).
   */
  static async fetchOddsForMatch(match: Match): Promise<MatchOdds> {
    // In a real system, this would query an external odds API using match.id
    
    // Generate realistic draw odds typically sitting between 3.0 and 4.2
    const drawOdds = Number((2.8 + (Math.random() * 1.5)).toFixed(2));
    
    // Create random spread between home and away based on arbitrary factors for mock variation
    const homeIsFavorite = Math.random() > 0.4; // Small home bias
    
    let homeWin, awayWin;
    if (homeIsFavorite) {
      homeWin = Number((1.5 + (Math.random() * 1.2)).toFixed(2));
      awayWin = Number((3.5 + (Math.random() * 3.0)).toFixed(2));
    } else {
      homeWin = Number((2.8 + (Math.random() * 2.0)).toFixed(2));
      awayWin = Number((1.8 + (Math.random() * 1.2)).toFixed(2));
    }
    
    return {
      homeWin,
      draw: drawOdds,
      awayWin
    };
  }
}
