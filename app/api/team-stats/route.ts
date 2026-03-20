import { NextResponse } from 'next/server';
import { FootballDataService } from '@/services/footballDataService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId   = searchParams.get('teamId');
  const leagueId = searchParams.get('leagueId');

  if (!teamId) {
    return NextResponse.json({ success: false, error: 'teamId parameter is required' }, { status: 400 });
  }

  try {
    const stats = await FootballDataService.getTeamStats(
      teamId,
      leagueId ? parseInt(leagueId, 10) : 39
    );
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error(`Failed to fetch team stats for ${teamId}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team stats.' }, { status: 500 });
  }
}
