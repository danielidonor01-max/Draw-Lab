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
  static async fetchOddsForMatch(match: Match): Promise<MatchOdds | null> {
    const key = process.env.API_FOOTBALL_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
    
    if (!key) {
      throw new Error("API key missing. Cannot fetch live odds.");
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
         return null; // Odds not explicitly released yet
      }
      
      const bookmaker = data.response[0].bookmakers[0];
      if (!bookmaker) return null;

      // Navigate to Match Winner market (Bet ID: 1)
      const matchWinnerBet = bookmaker.bets.find((b: { id: number }) => b.id === 1);
      
      if (!matchWinnerBet) return null;
      
      const homeWin = parseFloat(matchWinnerBet.values.find((v: { value: string, odd: string }) => v.value === 'Home')?.odd || '0');
      const draw = parseFloat(matchWinnerBet.values.find((v: { value: string, odd: string }) => v.value === 'Draw')?.odd || '0');
      const awayWin = parseFloat(matchWinnerBet.values.find((v: { value: string, odd: string }) => v.value === 'Away')?.odd || '0');
      
      if (!homeWin || !draw || !awayWin) {
        return null; // Incomplete odds string
      }
      
      return { homeWin, draw, awayWin };

    } catch (err) {
      console.warn(`Live odds fetch failed or unreleased for match ${match.id}.`);
      return null;
    }
  }
}
