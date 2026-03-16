import { NextResponse } from 'next/server';
import { FootballDataService } from '../../../services/footballDataService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team1 = searchParams.get('team1');
  const team2 = searchParams.get('team2');

  if (!team1 || !team2) {
    return NextResponse.json({ success: false, error: 'team1 and team2 parameters are required' }, { status: 400 });
  }

  try {
    const h2h = await FootballDataService.getHeadToHead(team1, team2);
    return NextResponse.json({ success: true, data: h2h });
  } catch (error) {
    console.error(`Failed to fetch H2H for ${team1} vs ${team2}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch Head-to-Head data.' }, { status: 500 });
  }
}
