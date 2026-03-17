import { Match } from '../types/match';

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export class OddsService {
  /**
   * Fetches live bookmaker odds for a given match using API-Football (Bet365 usually ID 8).
   * Falls back to realistic mocked odds if no API key is present or if the fetch fails (e.g. odds not released yet).
   */
  static async fetchOddsForMatch(match: Match): Promise<MatchOdds> {
    const key = process.env.API_FOOTBALL_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
    
    if (!key) {
      return this.generateMockOdds();
    }

    try {
      // Query specifically for Bet365 (bookmaker 8) to get reliable Match Winner odds
      const url = `${baseUrl}/odds?fixture=${match.id}&bookmaker=8`;
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        headers: { 'x-apisports-key': key },
        signal: controller.signal
      });
      clearTimeout(id);
      
      const data = await response.json();
      
      if (!data.response || data.response.length === 0) {
         throw new Error("No odds available yet for this fixture");
      }
      
      // Navigate to Match Winner market (Bet ID: 1)
      const bookmaker = data.response[0].bookmakers[0];
      const matchWinnerBet = bookmaker.bets.find((b: any) => b.id === 1);
      
      if (!matchWinnerBet) {
         throw new Error("Match Winner market not found");
      }
      
      const homeWin = parseFloat(matchWinnerBet.values.find((v: any) => v.value === 'Home')?.odd || '0');
      const draw = parseFloat(matchWinnerBet.values.find((v: any) => v.value === 'Draw')?.odd || '0');
      const awayWin = parseFloat(matchWinnerBet.values.find((v: any) => v.value === 'Away')?.odd || '0');
      
      if (!homeWin || !draw || !awayWin) {
        throw new Error("Incomplete odds string returned");
      }
      
      return { homeWin, draw, awayWin };

    } catch (err) {
      console.warn(`Live odds fetch failed for match ${match.id}, isolating to mock. Error: ${err}`);
      return this.generateMockOdds();
    }
  }

  private static generateMockOdds(): MatchOdds {
    const drawOdds = Number((2.8 + (Math.random() * 1.5)).toFixed(2));
    const homeIsFavorite = Math.random() > 0.4;
    
    let homeWin, awayWin;
    if (homeIsFavorite) {
      homeWin = Number((1.5 + (Math.random() * 1.2)).toFixed(2));
      awayWin = Number((3.5 + (Math.random() * 3.0)).toFixed(2));
    } else {
      homeWin = Number((2.8 + (Math.random() * 2.0)).toFixed(2));
      awayWin = Number((1.8 + (Math.random() * 1.2)).toFixed(2));
    }
    
    return { homeWin, draw: drawOdds, awayWin };
  }
}
