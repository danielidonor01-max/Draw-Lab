import { DetailedMatch, Match, TeamStats, RecentForm, HeadToHeadMatch, LeagueAverages } from '../types/match';
import { OddsService } from './oddsService';
import { ApiFootballFixtureResponse, ApiFootballTeamStatsResponse } from '../types/api-football';

const API_TIMEOUT = 8000;
const CACHE_TTL = 300000; // 5 mins

// In-memory cache (best-effort; resets on cold starts)
const cache: Record<string, { data: any, timestamp: number }> = {};

/**
 * Supported leagues mapped to approximate league averages (saves expensive /leagues lookups).
 */
const LEAGUE_BASELINES: Record<number, LeagueAverages> = {
  39:  { averageGoalsPerMatch: 2.85, averageHomeGoals: 1.55, averageAwayGoals: 1.30 }, // EPL
  140: { averageGoalsPerMatch: 2.50, averageHomeGoals: 1.40, averageAwayGoals: 1.10 }, // La Liga
  135: { averageGoalsPerMatch: 2.60, averageHomeGoals: 1.45, averageAwayGoals: 1.15 }, // Serie A
  78:  { averageGoalsPerMatch: 3.10, averageHomeGoals: 1.70, averageAwayGoals: 1.40 }, // Bundesliga
  61:  { averageGoalsPerMatch: 2.70, averageHomeGoals: 1.50, averageAwayGoals: 1.20 }, // Ligue 1
};

// All leagues to fetch during each cron sync
const SUPPORTED_LEAGUE_IDS = Object.keys(LEAGUE_BASELINES).map(Number);

export const SUPPORTED_LEAGUES = [
  'English Premier League',
  'Spanish La Liga',
  'Italian Serie A',
  'German Bundesliga',
  'French Ligue 1',
];

/**
 * Derive the current football season year.
 * Most leagues run Aug–May; if we're in Jan–Jul, the season started the previous year.
 */
function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  return month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

const getApiHeaders = () => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  return { 'x-apisports-key': key };
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';

/**
 * Fetch wrapper with timeout and in-memory cache.
 */
async function fetchWithCache(endpoint: string, cacheKey: string): Promise<any> {
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  const headers = getApiHeaders();
  if (!headers) throw new Error('CRITICAL ERROR: API_FOOTBALL_KEY is missing.');

  const url = `${getBaseUrl()}${endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`API-Football Error: ${JSON.stringify(data.errors)}`);
    }

    cache[cacheKey] = { data, timestamp: now };
    return data;
  } catch (error) {
    clearTimeout(timeout);
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

// ============================
// DATA MAPPERS
// ============================

function mapApiTeamStats(statsData: ApiFootballTeamStatsResponse): TeamStats {
  const played = statsData.fixtures?.played?.total || 1;
  return {
    averageGoalsScoredPerMatch: parseFloat(statsData.goals?.for?.average?.total || '0'),
    averageGoalsConcededPerMatch: parseFloat(statsData.goals?.against?.average?.total || '0'),
    homeGoalsScored:    statsData.goals?.for?.total?.home    || 0,
    awayGoalsScored:    statsData.goals?.for?.total?.away    || 0,
    homeGoalsConceded:  statsData.goals?.against?.total?.home || 0,
    awayGoalsConceded:  statsData.goals?.against?.total?.away || 0,
    totalMatchesPlayed: played,
    numberOfDraws:      statsData.fixtures?.draws?.total     || 0,
  };
}

function mapRecentForm(formString?: string): RecentForm {
  if (!formString) return { last5Matches: [] };
  const characters = formString.split('').reverse().slice(0, 5);
  return {
    last5Matches: characters.map(char => ({
      result: (['W', 'D', 'L'].includes(char) ? char : 'D') as 'W' | 'D' | 'L',
      goalsScored: 0,
      goalsConceded: 0,
    })),
  };
}

function mapApiH2H(fixtures: ApiFootballFixtureResponse[]): HeadToHeadMatch[] {
  return fixtures.map(f => ({
    homeTeamScore: f.goals?.home ?? 0,
    awayTeamScore: f.goals?.away ?? 0,
    competition:   f.league.name,
    date:          f.fixture.date,
  }));
}

function getLeagueAveragesFallback(leagueId: number): LeagueAverages {
  return LEAGUE_BASELINES[leagueId] || { averageGoalsPerMatch: 2.65, averageHomeGoals: 1.45, averageAwayGoals: 1.20 };
}

// ============================
// SERVICE EXPORTS
// ============================

export const FootballDataService = {

  /**
   * Fetches upcoming fixtures across ALL supported leagues for today's date.
   */
  async getUpcomingMatches(): Promise<DetailedMatch[]> {
    const dateStr   = new Date().toISOString().split('T')[0];
    const season    = getCurrentSeason();
    const allMatches: DetailedMatch[] = [];

    for (const leagueId of SUPPORTED_LEAGUE_IDS) {
      try {
        const data = await fetchWithCache(
          `/fixtures?date=${dateStr}&league=${leagueId}&season=${season}`,
          `upcoming_${dateStr}_${leagueId}`
        );

        const apiFixtures: ApiFootballFixtureResponse[] = data.response || [];

        // Process up to 15 fixtures per league
        for (const apiMatch of apiFixtures.slice(0, 15)) {
          try {
            const [homeStatsRes, awayStatsRes, h2hRes] = await Promise.all([
              fetchWithCache(
                `/teams/statistics?team=${apiMatch.teams.home.id}&league=${leagueId}&season=${season}`,
                `stats_${apiMatch.teams.home.id}_${leagueId}`
              ),
              fetchWithCache(
                `/teams/statistics?team=${apiMatch.teams.away.id}&league=${leagueId}&season=${season}`,
                `stats_${apiMatch.teams.away.id}_${leagueId}`
              ),
              fetchWithCache(
                `/fixtures/headtohead?h2h=${apiMatch.teams.home.id}-${apiMatch.teams.away.id}&last=5`,
                `h2h_${apiMatch.teams.home.id}_${apiMatch.teams.away.id}`
              ),
            ]);

            const match: DetailedMatch = {
              id:       apiMatch.fixture.id.toString(),
              league:   apiMatch.league.name,
              season:   apiMatch.league.season.toString(),
              homeTeam: apiMatch.teams.home.name,
              awayTeam: apiMatch.teams.away.name,
              kickoff:  apiMatch.fixture.date,
              homeTeamStats:  mapApiTeamStats(homeStatsRes.response),
              awayTeamStats:  mapApiTeamStats(awayStatsRes.response),
              homeForm:       mapRecentForm(homeStatsRes.response?.form),
              awayForm:       mapRecentForm(awayStatsRes.response?.form),
              headToHead:     mapApiH2H(h2hRes.response || []),
              leagueAverages: getLeagueAveragesFallback(leagueId),
            };

            const liveOdds = await OddsService.fetchOddsForMatch({ id: match.id } as Match);
            match.odds = liveOdds || undefined;
            allMatches.push(match);
          } catch (fixtureErr) {
            console.warn(`Skipping fixture ${apiMatch.fixture.id} due to error:`, fixtureErr);
          }
        }
      } catch (leagueErr) {
        console.error(`Failed to fetch league ${leagueId}:`, leagueErr);
        // Continue to next league rather than aborting all
      }
    }

    return allMatches;
  },

  /**
   * Fetches a single match's team stats for the /api/team-stats endpoint.
   */
  async getTeamStats(teamId: string, leagueId: number = 39): Promise<TeamStats> {
    const season = getCurrentSeason();
    const resp = await fetchWithCache(
      `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
      `stats_${teamId}_${leagueId}`
    );
    return mapApiTeamStats(resp.response);
  },

  /**
   * Fetches H2H history for two teams.
   */
  async getHeadToHead(team1Id: string, team2Id: string): Promise<HeadToHeadMatch[]> {
    const h2hRes = await fetchWithCache(
      `/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=5`,
      `h2h_${team1Id}_${team2Id}`
    );
    return mapApiH2H(h2hRes.response || []);
  },
};
