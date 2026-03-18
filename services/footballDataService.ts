import { DetailedMatch, Match, TeamStats, RecentForm, HeadToHeadMatch, LeagueAverages } from '../types/match';
import { OddsService } from './oddsService';
import { ApiFootballFixtureResponse, ApiFootballTeamStatsResponse } from '../types/api-football';

const API_TIMEOUT = 5000;
const CACHE_TTL = 300000; // 5 mins

// In-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};

/**
 * Supported leagues for the application.
 * Mapped to approximate baseline goals per match to save expensive `/leagues` API lookups.
 */
const LEAGUE_BASELINES: Record<number, LeagueAverages> = {
  39: { averageGoalsPerMatch: 2.85, averageHomeGoals: 1.55, averageAwayGoals: 1.30 }, // EPL
  140: { averageGoalsPerMatch: 2.50, averageHomeGoals: 1.40, averageAwayGoals: 1.10 }, // La Liga
  135: { averageGoalsPerMatch: 2.60, averageHomeGoals: 1.45, averageAwayGoals: 1.15 }, // Serie A
  78: { averageGoalsPerMatch: 3.10, averageHomeGoals: 1.70, averageAwayGoals: 1.40 }, // Bundesliga
  61: { averageGoalsPerMatch: 2.70, averageHomeGoals: 1.50, averageAwayGoals: 1.20 }, // Ligue 1
};

export const SUPPORTED_LEAGUES = [
  'English Premier League',
  'Spanish La Liga',
  'Italian Serie A',
  'German Bundesliga',
  'French Ligue 1'
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
  if (!headers) {
    throw new Error("CRITICAL ERROR: API key missing. Live data fetch blocked.");
  }

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
    console.error(`Fetch failed for ${url}:`, error);
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

function mapRecentForm(formString?: string): RecentForm {
  if (!formString) return { last5Matches: [] };
  
  // API returns strings like 'WDLLW'
  const characters = formString.split('').reverse().slice(0, 5);
  
  const matches = characters.map(char => ({
    result: (char === 'W' || char === 'D' || char === 'L') ? char : 'D',
    goalsScored: 0, // Not provided strictly in the form string abstraction
    goalsConceded: 0 
  }));
  
  return { last5Matches: matches as { result: 'W'|'D'|'L', goalsScored: number, goalsConceded: number }[] };
}

function mapApiH2H(fixtures: ApiFootballFixtureResponse[]): HeadToHeadMatch[] {
  return fixtures.map(f => ({
    homeTeamScore: f.goals?.home ?? 0,
    awayTeamScore: f.goals?.away ?? 0,
    competition: f.league.name,
    date: f.fixture.date,
  }));
}

function getLeagueAveragesFallback(leagueId: number): LeagueAverages {
  return LEAGUE_BASELINES[leagueId] || { averageGoalsPerMatch: 2.65, averageHomeGoals: 1.45, averageAwayGoals: 1.20 };
}


// ============================
// SERVICE EXPORTS
// ============================

export const FootballDataService = {
  
  async getUpcomingMatches(): Promise<DetailedMatch[]> {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const selectedLeague = 39; // Premier League priority demo
      const currentSeason = new Date().getFullYear() - 1; // Or hardcode dynamic year 

      const data = await fetchWithCache(`/fixtures?date=${dateStr}&league=${selectedLeague}&season=${currentSeason}`, `upcoming_${dateStr}`);
      
      const apiFixtures: ApiFootballFixtureResponse[] = data.response || [];
      const matches: DetailedMatch[] = [];

      // Process up to 5 fixtures to respect API limits locally
      for (const apiMatch of apiFixtures.slice(0, 5)) {
        // Fetch detailed stats for home & away teams
        const homeStatsRes = await fetchWithCache(`/teams/statistics?team=${apiMatch.teams.home.id}&league=${apiMatch.league.id}&season=${apiMatch.league.season}`, `stats_${apiMatch.teams.home.id}`);
        const awayStatsRes = await fetchWithCache(`/teams/statistics?team=${apiMatch.teams.away.id}&league=${apiMatch.league.id}&season=${apiMatch.league.season}`, `stats_${apiMatch.teams.away.id}`);

        // Fetch H2H directly
        const h2hRes = await fetchWithCache(`/fixtures/headtohead?h2h=${apiMatch.teams.home.id}-${apiMatch.teams.away.id}&last=5`, `h2h_${apiMatch.teams.home.id}_${apiMatch.teams.away.id}`);

        const match: DetailedMatch = {
          id: apiMatch.fixture.id.toString(),
          league: apiMatch.league.name,
          season: apiMatch.league.season.toString(),
          homeTeam: apiMatch.teams.home.name,
          awayTeam: apiMatch.teams.away.name,
          kickoff: apiMatch.fixture.date,
          
          homeTeamStats: mapApiTeamStats(homeStatsRes.response),
          awayTeamStats: mapApiTeamStats(awayStatsRes.response),
          
          homeForm: mapRecentForm(homeStatsRes.response?.form),
          awayForm: mapRecentForm(awayStatsRes.response?.form),
          
          headToHead: mapApiH2H(h2hRes.response || []),
          leagueAverages: getLeagueAveragesFallback(apiMatch.league.id)
        };

        // Complete Live Integrity
        const liveOdds = await OddsService.fetchOddsForMatch({ id: match.id } as Match);
        match.odds = liveOdds || undefined;
        matches.push(match);
      }
      
      return matches;
    } catch (err) {
      console.error("CRITICAL DATA FLOW ERROR: Live API integration explicitly failed.", err);
      // Graceful fallback: return empty active queue rather than bringing down Next.js routing or inserting Dummy data.
      return []; 
    }
  },

  async getMatchDetails(matchId: string): Promise<DetailedMatch | null> {
    throw new Error("Fallback execution blocked. Real ID match lookup required.");
  },

  async getTeamStats(teamId: string): Promise<TeamStats> {
    const resp = await fetchWithCache(`/teams/statistics?team=${teamId}&league=39&season=2023`, `stats_${teamId}`);
    return mapApiTeamStats(resp.response);
  },

  async getHeadToHead(team1Id: string, team2Id: string): Promise<HeadToHeadMatch[]> {
    const h2hRes = await fetchWithCache(`/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=5`, `h2h_${team1Id}_${team2Id}`);
    return mapApiH2H(h2hRes.response || []);
  }
};
