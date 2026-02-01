import { NextResponse } from 'next/server';

// Import the same scanSessions map
// Note: In a real app, you'd want to share this via a module or use Redis/database
// For now, we'll recreate the logic - but ideally this should be in a shared module

// In production, use Redis or database instead
// This is a simplified in-memory approach
declare global {
  // eslint-disable-next-line no-var
  var scanSessions: Map<string, { device: { type: string; platform: string } | null; timestamp: number }> | undefined;
}

// Use global to persist across hot reloads in development
const scanSessions = globalThis.scanSessions || new Map<string, { device: { type: string; platform: string } | null; timestamp: number }>();
if (!globalThis.scanSessions) {
  globalThis.scanSessions = scanSessions;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID diperlukan' },
        { status: 400 }
      );
    }

    const sessionData = scanSessions.get(sessionId);

    if (!sessionData || !sessionData.device) {
      return NextResponse.json({
        success: true,
        detected: false,
      });
    }

    return NextResponse.json({
      success: true,
      detected: true,
      device: sessionData.device,
    });
  } catch (error) {
    console.error('Error checking scan status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memeriksa status scan' },
      { status: 500 }
    );
  }
}

