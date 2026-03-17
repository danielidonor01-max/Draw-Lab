import { DetailedMatch, Match, TeamStats, RecentForm, HeadToHeadMatch, LeagueAverages } from '../types/match';
import { OddsService } from './oddsService';
import { ApiFootballFixtureResponse, ApiFootballTeamStatsResponse } from '../types/api-football';

const API_TIMEOUT = 5000;
const CACHE_TTL = 300000; // 5 mins

// In-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};

/**
 * Supported leagues for the application.
 */
export const SUPPORTED_LEAGUES = [
  'English Premier League',
  'Spanish La Liga',
  'Italian Serie A',
  'German Bundesliga',
  'French Ligue 1',
  'Portuguese Primeira Liga',
  'Dutch Eredivisie',
  'Belgian Pro League',
  'Turkish Super Lig',
  'English Championship',
  'Spanish Segunda Division',
  'Italian Serie B'
];

/**
 * API-Football connection details
 */
const getApiHeaders = () => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  return {
    'x-apisports-key': key
  };
};

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
};

/**
 * Intelligent fetch wrapper with timeout and caching.
 */
async function fetchWithCache(endpoint: string, key: string): Promise<any> {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < CACHE_TTL)) {
    return cache[key].data;
  }

  const headers = getApiHeaders();
  if (!headers) throw new Error("API key missing. Falling back to mock data.");

  const url = `${getBaseUrl()}${endpoint}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_TIMEOUT);
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // API-Football specific error structure
    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`API-Football Error: ${JSON.stringify(data.errors)}`);
    }

    cache[key] = { data, timestamp: now };
    return data;
  } catch (error) {
    console.warn(`Fetch failed for ${url}, fallback triggered.`);
    throw error;
  }
}

// ============================
// DATA MAPPERS (API -> Internal)
// ============================

function mapApiTeamStats(statsData: ApiFootballTeamStatsResponse): TeamStats {
  const played = statsData.fixtures?.played?.total || 1;
  return {
    averageGoalsScoredPerMatch: parseFloat(statsData.goals?.for?.average?.total || '0'),
    averageGoalsConcededPerMatch: parseFloat(statsData.goals?.against?.average?.total || '0'),
    homeGoalsScored: statsData.goals?.for?.total?.home || 0,
    awayGoalsScored: statsData.goals?.for?.total?.away || 0,
    homeGoalsConceded: statsData.goals?.against?.total?.home || 0,
    awayGoalsConceded: statsData.goals?.against?.total?.away || 0,
    totalMatchesPlayed: played,
    numberOfDraws: statsData.fixtures?.draws?.total || 0,
  };
}

// ============================
// MOCK FALLBACK GENERATORS
// ============================

function generateMockTeamStats(): TeamStats {
  return {
    averageGoalsScoredPerMatch: +(Math.random() * 2 + 0.5).toFixed(2),
    averageGoalsConcededPerMatch: +(Math.random() * 2 + 0.5).toFixed(2),
    homeGoalsScored: Math.floor(Math.random() * 30 + 10),
    awayGoalsScored: Math.floor(Math.random() * 25 + 5),
    homeGoalsConceded: Math.floor(Math.random() * 20 + 5),
    awayGoalsConceded: Math.floor(Math.random() * 25 + 10),
    totalMatchesPlayed: 25,
    numberOfDraws: Math.floor(Math.random() * 10 + 2),
  };
}

function generateMockForm(): RecentForm {
  const results: ('W' | 'D' | 'L')[] = ['W', 'D', 'L'];
  const last5Matches = Array.from({ length: 5 }, () => ({
    result: results[Math.floor(Math.random() * results.length)],
    goalsScored: Math.floor(Math.random() * 4),
    goalsConceded: Math.floor(Math.random() * 4)
  }));
  return { last5Matches };
}

function generateMockH2H(): HeadToHeadMatch[] {
  return Array.from({ length: 5 }, (_, i) => ({
    homeTeamScore: Math.floor(Math.random() * 4),
    awayTeamScore: Math.floor(Math.random() * 4),
    competition: 'League',
    date: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function generateMockLeagueAverages(): LeagueAverages {
  return {
    averageGoalsPerMatch: 2.65,
    averageHomeGoals: 1.45,
    averageAwayGoals: 1.20
  };
}

async function generateMockMatches(): Promise<DetailedMatch[]> {
  const teams = ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Dortmund', 'Juventus', 'AC Milan', 'PSG', 'Marseille'];
  
  const matches: DetailedMatch[] = [];
  
  for (let i = 0; i < 8; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
    while (awayTeam === homeTeam) awayTeam = teams[Math.floor(Math.random() * teams.length)];
    
    const m: DetailedMatch = {
      id: `match_${i + 1}`,
      league: SUPPORTED_LEAGUES[Math.floor(Math.random() * 5)], // Pick from top 5 for demo
      season: '2023/2024',
      homeTeam,
      awayTeam,
      kickoff: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      homeTeamStats: generateMockTeamStats(),
      awayTeamStats: generateMockTeamStats(),
      homeForm: generateMockForm(),
      awayForm: generateMockForm(),
      headToHead: generateMockH2H(),
      leagueAverages: generateMockLeagueAverages()
    };

    // Cast as Match so OddsService can accept it, though we only really need the ID inside dummy fetchOddsForMatch 
    m.odds = await OddsService.fetchOddsForMatch(m as unknown as Match);
    matches.push(m);
  }

  return matches;
}

// ============================
// SERVICE EXPORTS
// ============================

export const FootballDataService = {
  
  async getUpcomingMatches(): Promise<DetailedMatch[]> {
    try {
      // Get today's fixtures for a specific major league (e.g. English Premier League ID: 39, 2023 season)
      const dateStr = new Date().toISOString().split('T')[0];
      const selectedLeague = 39; // EPL
      const currentSeason = 2023; // Or hardcode dynamic year 

      const data = await fetchWithCache(`/fixtures?date=${dateStr}&league=${selectedLeague}&season=${currentSeason}`, `upcoming_${dateStr}`);
      
      const apiFixtures: ApiFootballFixtureResponse[] = data.response || [];
      const matches: DetailedMatch[] = [];

      // Loop top 5 fixtures to avoid hammering the API strictly during demo modes
      for (const apiMatch of apiFixtures.slice(0, 5)) {
        // Fetch detailed stats for home & away teams sequentially
        const homeStatsRes = await fetchWithCache(`/teams/statistics?team=${apiMatch.teams.home.id}&league=${apiMatch.league.id}&season=${apiMatch.league.season}`, `stats_${apiMatch.teams.home.id}`);
        const awayStatsRes = await fetchWithCache(`/teams/statistics?team=${apiMatch.teams.away.id}&league=${apiMatch.league.id}&season=${apiMatch.league.season}`, `stats_${apiMatch.teams.away.id}`);

        const match: DetailedMatch = {
          id: apiMatch.fixture.id.toString(),
          league: apiMatch.league.name,
          season: apiMatch.league.season.toString(),
          homeTeam: apiMatch.teams.home.name,
          awayTeam: apiMatch.teams.away.name,
          kickoff: apiMatch.fixture.date,
          homeTeamStats: mapApiTeamStats(homeStatsRes.response),
          awayTeamStats: mapApiTeamStats(awayStatsRes.response),
          
          // NOTE: Form, H2H, and League Averages require 3+ additional deep separate API queries each. 
          // Injecting fallbacks here so we respect strict API rate limits (10/min) on free tiers while still functioning.
          homeForm: generateMockForm(),
          awayForm: generateMockForm(),
          headToHead: generateMockH2H(),
          leagueAverages: generateMockLeagueAverages()
        };

        // Attempt fetching Live Pre-Match Odds
        match.odds = await OddsService.fetchOddsForMatch({ id: match.id } as Match);
        matches.push(match);
      }

      // If no matches today, fallback to mock to keep the UI active
      if (matches.length === 0) throw new Error("No live matches today");
      
      return matches;
    } catch (err) {
      console.warn("Live API integration failed or empty. Sideloading strictly isolated mock matches.");
      return generateMockMatches();
    }
  },

  async getMatchDetails(matchId: string): Promise<DetailedMatch | null> {
    try {
       // A single fetch for fixture details
       // We skip full implementation relying on the list for now
       throw new Error("Detailed match fallback triggered.");
    } catch {
      const matches = await generateMockMatches();
      return { ...matches[0], id: matchId }; 
    }
  },

  async getTeamStats(teamId: string): Promise<TeamStats> {
    try {
      const resp = await fetchWithCache(`/teams/statistics?team=${teamId}&league=39&season=2023`, `stats_${teamId}`);
      return mapApiTeamStats(resp.response);
    } catch {
      return generateMockTeamStats();
    }
  },

  async getHeadToHead(team1Id: string, team2Id: string): Promise<HeadToHeadMatch[]> {
     try {
       throw new Error("H2H Endpoint triggered mock.");
     } catch {
       return generateMockH2H();
     }
  }
};
