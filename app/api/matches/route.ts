import { NextResponse } from 'next/server';
import { FootballDataService } from '../../../services/footballDataService';
import { enrichMatchWithPrediction } from '../../../lib/probabilityEngine';
import { rankMatches } from '../../../lib/drawFinder';

export async function GET() {
  try {
    const rawMatches = await FootballDataService.getUpcomingMatches();
    const enrichedMatches = rawMatches.map(match => enrichMatchWithPrediction(match));
    
    // Sort all arrays by opportunity rank so client receives default best items
    const rankedMatches = rankMatches(enrichedMatches, enrichedMatches.length);
    
    return NextResponse.json({ success: true, count: rankedMatches.length, data: rankedMatches });
  } catch (error) {
    console.error('Failed to fetch upcoming matches in route:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch matches.' }, { status: 500 });
  }
}
