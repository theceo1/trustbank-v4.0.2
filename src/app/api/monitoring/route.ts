import { NextRequest, NextResponse } from 'next/server';

// Dummy Sentry tunnel endpoint for local/dev to silence 403 errors
// In production, Sentry will handle this route via tunnelRoute config
export async function POST(req: NextRequest) {
  // Optionally, forward to Sentry ingest endpoint here if needed
  return NextResponse.json({ status: 'ok', message: 'Monitoring event received (dev stub)' });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Monitoring GET (dev stub)' });
}
