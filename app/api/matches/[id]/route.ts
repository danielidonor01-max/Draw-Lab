import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const dbMatch = await prisma.match.findUnique({
      where: { id },
      include: { prediction: true },
    });

    if (!dbMatch) {
      return NextResponse.json({ success: false, error: 'Match not found.' }, { status: 404 });
    }

    const pred = dbMatch.prediction;

    const match = {
      id: dbMatch.id,
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
      headToHead: (dbMatch.headToHead as any) ?? [],
      leagueAverages: dbMatch.leagueAverages as any,
      odds: dbMatch.odds as any,
      drawProbability: pred?.drawProbability ?? undefined,
      prediction: pred ? {
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
      } : undefined,
    };

    return NextResponse.json({ success: true, data: match });
  } catch (error) {
    console.error(`Failed to fetch match ${id}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch match.' }, { status: 500 });
  }
}
