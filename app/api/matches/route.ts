/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankMatches } from '@/lib/drawFinder';

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
        // Use the correct DB field names that the frontend components expect
        homeTeamId: dbMatch.homeTeamId,
        awayTeamId: dbMatch.awayTeamId,
        league: dbMatch.league,
        season: dbMatch.season || '2023',
        kickoffTime: dbMatch.kickoffTime.toISOString(),
        status: (dbMatch.status as 'SCHEDULED' | 'IN_PLAY' | 'FINISHED') || 'SCHEDULED',
        homeScore: dbMatch.homeScore ?? undefined,
        awayScore: dbMatch.awayScore ?? undefined,
        homeTeamStats: dbMatch.homeTeamStats as any,
        awayTeamStats: dbMatch.awayTeamStats as any,
        homeForm: dbMatch.homeForm as any,
        awayForm: dbMatch.awayForm as any,
        headToHead: dbMatch.headToHead as any,
        leagueAverages: dbMatch.leagueAverages as any,
        odds: dbMatch.odds as any,
        // Top-level drawProbability for the Match interface
        drawProbability: dbMatch.prediction?.drawProbability ?? undefined,
      };

      const pred = dbMatch.prediction;

      // Nest prediction fields into a proper prediction object so rankMatches() can filter/sort
      const prediction = pred ? {
        matchId: pred.matchId,
        homeWinProbability: pred.homeWinProbability,
        awayWinProbability: pred.awayWinProbability,
        drawProbability: pred.drawProbability,
        adjustedDrawProbability: pred.adjustedDrawProbability ?? undefined,
        expectedGoalsHome: pred.expectedGoalsHome,
        expectedGoalsAway: pred.expectedGoalsAway,
        scoreProbabilities: pred.scoreProbabilities as any,
        indicators: (pred.indicators as string[]) ?? [],
        indicatorDetails: pred.indicatorDetails as any,
        confidenceScore: pred.confidenceScore,
        opportunityScore: pred.opportunityScore ?? undefined,
        opportunityCategory: (pred.opportunityCategory as 'Very High' | 'High' | 'Moderate' | 'Low') ?? undefined,
        impliedProbability: pred.impliedProbability ?? undefined,
        expectedValue: pred.expectedValue ?? undefined,
        valueRating: (pred.valueRating as 'Strong value' | 'Good value' | 'Small value' | 'No value') ?? undefined,
      } : undefined;

      return { ...match, prediction };
    });

    // Sort by opportunity score descending (only matches that have predictions with a score)
    const rankedMatches = rankMatches(enrichedMatches as any, enrichedMatches.length);

    // Append matches that have no opportunityScore after the ranked ones
    const unranked = enrichedMatches.filter(m => m.prediction?.opportunityScore === undefined);
    const allMatches = [...rankedMatches, ...unranked];

    return NextResponse.json({ success: true, count: allMatches.length, data: allMatches });
  } catch (error) {
    console.error('Failed to fetch upcoming matches from Database:', error);
    return NextResponse.json({ success: false, error: 'Failed to read matches from Database.' }, { status: 500 });
  }
}
