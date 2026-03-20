/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Temporary admin route — DELETE THIS FILE after use
export async function GET(request: Request) {
  // Basic protection — require a secret param to avoid accidental runs
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'drawlab_reset_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const predictions = await prisma.prediction.deleteMany({});
    const matches     = await prisma.match.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Database cleared. Ready for fresh cron sync.',
      deleted: {
        predictions: predictions.count,
        matches: matches.count,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
