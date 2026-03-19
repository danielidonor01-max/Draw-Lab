export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface TeamStats {
  averageGoalsScoredPerMatch: number;
  averageGoalsConcededPerMatch: number;
  homeGoalsScored: number;
  awayGoalsScored: number;
  homeGoalsConceded: number;
  awayGoalsConceded: number;
  totalMatchesPlayed: number;
  numberOfDraws: number;
}

export interface RecentFormMatch {
  result: 'W' | 'D' | 'L';
  goalsScored: number;
  goalsConceded: number;
}

export interface RecentForm {
  last5Matches: RecentFormMatch[];
}

export interface HeadToHeadMatch {
  homeTeamScore: number;
  awayTeamScore: number;
  competition: string;
  date: string;
}

export interface LeagueAverages {
  averageGoalsPerMatch: number;
  averageHomeGoals: number;
  averageAwayGoals: number;
}

export interface DetailedMatch {
  id: string;
  league: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
  homeForm: RecentForm;
  awayForm: RecentForm;
  headToHead: HeadToHeadMatch[];
  leagueAverages: LeagueAverages;
  odds?: MatchOdds;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  league: string;
  season?: string;
  kickoffTime: string;
  status: 'SCHEDULED' | 'IN_PLAY' | 'FINISHED';
  homeScore?: number;
  awayScore?: number;
  drawProbability?: number;
  confidenceScore?: number;
  odds?: MatchOdds;
}
