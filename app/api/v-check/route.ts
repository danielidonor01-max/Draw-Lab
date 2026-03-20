import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    version: 'v1.2.0-STABLE',
    deployTime: new Date().toISOString(),
    message: 'If you see this, the new code is live!'
  });
}
