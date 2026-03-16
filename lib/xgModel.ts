import { TeamStats, LeagueAverages } from '../types/match';

/**
 * Calculates Attack and Defense strengths.
 * Attack Strength = team avg goals scored / league avg goals
 * Defense Strength = team avg goals conceded / league avg goals
 */
export function calculateTeamStrengths(teamStats: TeamStats, leagueAverages: LeagueAverages) {
  // Prevent division by zero
  const leagueAvg = Math.max(0.1, leagueAverages.averageGoalsPerMatch);
  
  const attackStrength = teamStats.averageGoalsScoredPerMatch / leagueAvg;
  const defenseStrength = teamStats.averageGoalsConcededPerMatch / leagueAvg;

  return { attackStrength, defenseStrength };
}

/**
 * Calculates Expected Goals (xG) for a match.
 * Home xG = home attack strength * away defense strength * league home goals average
 * Away xG = away attack strength * home defense strength * league away goals average
 */
export function calculateExpectedGoals(
  homeStats: TeamStats, 
  awayStats: TeamStats, 
  leagueAverages: LeagueAverages
) {
  const homeStrengths = calculateTeamStrengths(homeStats, leagueAverages);
  const awayStrengths = calculateTeamStrengths(awayStats, leagueAverages);

  let homeXG = homeStrengths.attackStrength * awayStrengths.defenseStrength * leagueAverages.averageHomeGoals;
  let awayXG = awayStrengths.attackStrength * homeStrengths.defenseStrength * leagueAverages.averageAwayGoals;

  // Add a floor/ceiling to prevent absurd values in edge case stats
  homeXG = Math.max(0.1, Math.min(homeXG, 5.0));
  awayXG = Math.max(0.1, Math.min(awayXG, 5.0));

  return { homeXG, awayXG };
}
