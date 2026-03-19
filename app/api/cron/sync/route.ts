import { NextResponse } from 'next/server';
import { FootballDataService } from '../../../../services/footballDataService';
import { enrichMatchWithPrediction } from '../../../../lib/probabilityEngine';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // 0. Vercel Cron Security Validation
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized payload source' }, { status: 401 });
    }

    // 1. Fetch live matches coming up today
    const rawMatches = await FootballDataService.getUpcomingMatches();
    
    // 2. Mathematically predict them all
    const enrichedMatches = rawMatches.map(match => enrichMatchWithPrediction(match));
    
    // 3. Upsert them all into the Supabase database
    for (const enriched of enrichedMatches) {
      const fullMatch = enriched as any; // Bypass TS strict inference blocking DetailedMatch destructuring
      const prediction = fullMatch.prediction;
      const odds = fullMatch.odds;

      await prisma.match.upsert({
        where: { id: fullMatch.id },
        update: {
          status: 'SCHEDULED', // DetailedMatch does not return Status yet
          homeScore: null,
          awayScore: null,
          // Update volatile stats
          homeTeamStats: (fullMatch.homeTeamStats || {}) as any,
          awayTeamStats: (fullMatch.awayTeamStats || {}) as any,
          homeForm: (fullMatch.homeForm || {}) as any,
          awayForm: (fullMatch.awayForm || {}) as any,
          headToHead: (fullMatch.headToHead || []) as any,
          leagueAverages: (fullMatch.leagueAverages || {}) as any,
          odds: (odds || null) as any,
        },
        create: {
          id: fullMatch.id,
          // enrichMatchWithPrediction maps homeTeam->homeTeamId and kickoff->kickoffTime
          homeTeamId: fullMatch.homeTeamId,
          awayTeamId: fullMatch.awayTeamId,
          league: fullMatch.league,
          season: fullMatch.season || '2023',
          kickoffTime: new Date(fullMatch.kickoffTime),
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          
          homeTeamStats: (fullMatch.homeTeamStats || {}) as any,
          awayTeamStats: (fullMatch.awayTeamStats || {}) as any,
          homeForm: (fullMatch.homeForm || {}) as any,
          awayForm: (fullMatch.awayForm || {}) as any,
          headToHead: (fullMatch.headToHead || []) as any,
          leagueAverages: (fullMatch.leagueAverages || {}) as any,
          odds: (odds || null) as any,
          
          prediction: prediction ? {
            create: {
              homeWinProbability: prediction.homeWinProbability,
              awayWinProbability: prediction.awayWinProbability,
              drawProbability: prediction.drawProbability,
              adjustedDrawProbability: prediction.adjustedDrawProbability,
              expectedGoalsHome: prediction.expectedGoalsHome,
              expectedGoalsAway: prediction.expectedGoalsAway,
              scoreProbabilities: prediction.scoreProbabilities as any,
              indicators: prediction.indicators as any,
              indicatorDetails: prediction.indicatorDetails as any,
              confidenceScore: prediction.confidenceScore,
              opportunityScore: prediction.opportunityScore,
              opportunityCategory: prediction.opportunityCategory,
              impliedProbability: prediction.impliedProbability,
              expectedValue: prediction.expectedValue,
              valueRating: prediction.valueRating,
            }
          } : undefined
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      synced: enrichedMatches.length, 
      message: 'Database Cache Updated successfully.' 
    });

  } catch (error: any) {
    console.error('CRON SYNC FAILED:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
