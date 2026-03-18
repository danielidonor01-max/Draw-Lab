import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { rankMatches } from '../../../lib/drawFinder';

export async function GET() {
  try {
    // 1. Fetch from Database instead of external API-Football
    const dbMatches = await prisma.match.findMany({
      include: {
        prediction: true,
      },
    });

    if (!dbMatches || dbMatches.length === 0) {
       return NextResponse.json({ success: true, count: 0, data: [] });
    }

    // 2. Map Database Schema back to Frontend Interface structure
    const enrichedMatches = dbMatches.map((dbMatch) => {
      const match = {
        id: dbMatch.id,
        league: dbMatch.league,
        season: dbMatch.season || '2023',
        homeTeam: "Home Team", // Simplified for mapping; usually stored
        awayTeam: "Away Team",
        kickoff: dbMatch.kickoffTime.toISOString(),
        homeTeamStats: dbMatch.homeTeamStats as any,
        awayTeamStats: dbMatch.awayTeamStats as any,
        homeForm: dbMatch.homeForm as any,
        awayForm: dbMatch.awayForm as any,
        headToHead: dbMatch.headToHead as any,
        leagueAverages: dbMatch.leagueAverages as any,
        odds: dbMatch.odds as any,
      };

      const pred = dbMatch.prediction;
      
      return {
        ...match,
        drawProbability: pred?.drawProbability || 0,
        adjustedDrawProbability: pred?.adjustedDrawProbability || 0,
        confidenceScore: pred?.confidenceScore || 0,
        opportunityScore: pred?.opportunityScore || 0,
        opportunityCategory: pred?.opportunityCategory || 'Low',
        
        homeWinProbability: pred?.homeWinProbability || 0,
        awayWinProbability: pred?.awayWinProbability || 0,
        expectedGoalsHome: pred?.expectedGoalsHome || 0,
        expectedGoalsAway: pred?.expectedGoalsAway || 0,
        scoreMatrix: pred?.scoreProbabilities as any,
        indicators: pred?.indicators as any,
        indicatorDetails: pred?.indicatorDetails as any,
        
        impliedProbability: pred?.impliedProbability || 0,
        expectedValue: pred?.expectedValue || 0,
        valueRating: pred?.valueRating || 'No value'
      };
    });
    
    // Sort all arrays by opportunity rank so client receives default best items
    const rankedMatches = rankMatches(enrichedMatches as any, enrichedMatches.length);
    
    return NextResponse.json({ success: true, count: rankedMatches.length, data: rankedMatches });
  } catch (error) {
    console.error('Failed to fetch upcoming matches from Database:', error);
    return NextResponse.json({ success: false, error: 'Failed to read matches from Database.' }, { status: 500 });
  }
}
