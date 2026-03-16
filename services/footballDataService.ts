import { DetailedMatch, Match, TeamStats, RecentForm, HeadToHeadMatch, LeagueAverages } from '../types/match';
import { OddsService } from './oddsService';

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
 * Intelligent fetch wrapper with timeout and caching.
 */
async function fetchWithCache(url: string, key: string): Promise<any> {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < CACHE_TTL)) {
    return cache[key].data;
  }

  // Attempt real fetch, fall back to throw error and catch below
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_TIMEOUT);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    cache[key] = { data, timestamp: now };
    return data;
  } catch (error) {
    console.warn(`Fetch failed for ${url}, fallback triggered.`);
    throw error;
  }
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
      // In a real application, replace with actual API URL
      return await fetchWithCache('https://api.football-data.invalid/upcoming', 'upcoming_matches');
    } catch {
      // Fallback
      return generateMockMatches();
    }
  },

  async getMatchDetails(matchId: string): Promise<DetailedMatch | null> {
    try {
      return await fetchWithCache(`https://api.football-data.invalid/match/${matchId}`, `match_${matchId}`);
    } catch {
      // Return a generated mock for this specific match using the mock list
      const matches = await generateMockMatches();
      return { ...matches[0], id: matchId }; // Just returning first item as mock 
    }
  },

  async getTeamStats(teamId: string): Promise<TeamStats> {
    try {
      return await fetchWithCache(`https://api.football-data.invalid/stats/${teamId}`, `stats_${teamId}`);
    } catch {
      return generateMockTeamStats();
    }
  },

  async getHeadToHead(team1Id: string, team2Id: string): Promise<HeadToHeadMatch[]> {
     try {
      return await fetchWithCache(`https://api.football-data.invalid/h2h/${team1Id}/${team2Id}`, `h2h_${team1Id}_${team2Id}`);
     } catch {
       return generateMockH2H();
     }
  }

};
