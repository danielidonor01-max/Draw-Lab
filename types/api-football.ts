/**
 * Type definitions mapping the JSON responses from v3.football.api-sports.io
 */

export interface ApiFootballFixtureResponse {
  fixture: {
    id: number;
    date: string;
    timezone: string;
    status: {
      short: string; // e.g., 'NS' (Not Started), 'FT' (Full Time)
    };
  };
  league: {
    id: number;
    name: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

export interface ApiFootballTeamStatsResponse {
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
  };
}

export interface ApiFootballOddsResponse {
  fixture: { id: number };
  bookmakers: {
    id: number;
    name: string;
    bets: {
      id: number;
      name: string; // usually 'Match Winner'
      values: {
        value: string; // 'Home', 'Draw', 'Away'
        odd: string;
      }[];
    }[];
  }[];
}
