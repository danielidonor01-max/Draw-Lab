import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { FootballDataService } from '@/services/footballDataService';
import { enrichMatchWithPrediction } from '@/lib/probabilityEngine';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 0. Vercel Cron Security Validation
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized payload source' }, { status: 401 });
    }

    // 1. Fetch live matches coming up today across all supported leagues
    const rawMatches = await FootballDataService.getUpcomingMatches();

    if (rawMatches.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No fixtures found for today.' });
    }

    // 2. Mathematically predict them all
    const enrichedMatches = rawMatches.map(match => enrichMatchWithPrediction(match));

    // 3. Upsert all matches + upsert their predictions
    let synced = 0;
    for (const enriched of enrichedMatches) {
      const fullMatch = enriched as any;
      const prediction = fullMatch.prediction;
      const odds = fullMatch.odds;

      try {
        // Upsert the Match record — update ALL fields so re-runs fix corrupt data
        await prisma.match.upsert({
          where: { id: fullMatch.id },
          update: {
            // FIX: include identity fields so existing corrupted records get corrected
            homeTeamId: fullMatch.homeTeamId,
            awayTeamId: fullMatch.awayTeamId,
            league:     fullMatch.league,
            season:     fullMatch.season || new Date().getFullYear().toString(),
            kickoffTime: new Date(fullMatch.kickoffTime),
            status: 'SCHEDULED',
            homeScore: null,
            awayScore: null,
            homeTeamStats:  (fullMatch.homeTeamStats || {}) as any,
            awayTeamStats:  (fullMatch.awayTeamStats || {}) as any,
            homeForm:       (fullMatch.homeForm || {}) as any,
            awayForm:       (fullMatch.awayForm || {}) as any,
            headToHead:     (fullMatch.headToHead || []) as any,
            leagueAverages: (fullMatch.leagueAverages || {}) as any,
            odds: (odds || null) as any,
          },
          create: {
            id:          fullMatch.id,
            homeTeamId:  fullMatch.homeTeamId,
            awayTeamId:  fullMatch.awayTeamId,
            league:      fullMatch.league,
            season:      fullMatch.season || new Date().getFullYear().toString(),
            kickoffTime: new Date(fullMatch.kickoffTime),
            status: 'SCHEDULED',
            homeScore: null,
            awayScore: null,
            homeTeamStats:  (fullMatch.homeTeamStats || {}) as any,
            awayTeamStats:  (fullMatch.awayTeamStats || {}) as any,
            homeForm:       (fullMatch.homeForm || {}) as any,
            awayForm:       (fullMatch.awayForm || {}) as any,
            headToHead:     (fullMatch.headToHead || []) as any,
            leagueAverages: (fullMatch.leagueAverages || {}) as any,
            odds: (odds || null) as any,
          },
        });

        // FIX: Upsert prediction separately so it updates on every run, not just on create
        if (prediction) {
          await prisma.prediction.upsert({
            where: { matchId: fullMatch.id },
            update: {
              homeWinProbability:      prediction.homeWinProbability,
              awayWinProbability:      prediction.awayWinProbability,
              drawProbability:         prediction.drawProbability,
              adjustedDrawProbability: prediction.adjustedDrawProbability,
              expectedGoalsHome:       prediction.expectedGoalsHome,
              expectedGoalsAway:       prediction.expectedGoalsAway,
              scoreProbabilities:      prediction.scoreProbabilities as any,
              indicators:              prediction.indicators as any,
              indicatorDetails:        prediction.indicatorDetails as any,
              confidenceScore:         prediction.confidenceScore,
              opportunityScore:        prediction.opportunityScore,
              opportunityCategory:     prediction.opportunityCategory,
              impliedProbability:      prediction.impliedProbability,
              expectedValue:           prediction.expectedValue,
              valueRating:             prediction.valueRating,
            },
            create: {
              matchId:                 fullMatch.id,
              homeWinProbability:      prediction.homeWinProbability,
              awayWinProbability:      prediction.awayWinProbability,
              drawProbability:         prediction.drawProbability,
              adjustedDrawProbability: prediction.adjustedDrawProbability,
              expectedGoalsHome:       prediction.expectedGoalsHome,
              expectedGoalsAway:       prediction.expectedGoalsAway,
              scoreProbabilities:      prediction.scoreProbabilities as any,
              indicators:              prediction.indicators as any,
              indicatorDetails:        prediction.indicatorDetails as any,
              confidenceScore:         prediction.confidenceScore,
              opportunityScore:        prediction.opportunityScore,
              opportunityCategory:     prediction.opportunityCategory,
              impliedProbability:      prediction.impliedProbability,
              expectedValue:           prediction.expectedValue,
              valueRating:             prediction.valueRating,
            },
          });
        }

        synced++;
      } catch (fixtureErr: any) {
        console.warn(`Skipping fixture ${fullMatch.id} (${fullMatch.homeTeamId} vs ${fullMatch.awayTeamId}):`, fixtureErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      total: enrichedMatches.length,
      message: `Synced ${synced} of ${enrichedMatches.length} fixtures successfully.`,
    });

  } catch (error: any) {
    console.error('CRON SYNC FAILED:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
