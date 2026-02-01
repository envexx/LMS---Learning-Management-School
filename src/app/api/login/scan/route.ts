import { NextResponse } from 'next/server';

// In-memory store untuk session detection
// Dalam production, bisa menggunakan Redis atau database
declare global {
  // eslint-disable-next-line no-var
  var scanSessions: Map<string, { device: { type: string; platform: string } | null; timestamp: number }> | undefined;
  // eslint-disable-next-line no-var
  var scanSessionsCleanup: NodeJS.Timeout | undefined;
}

// Use global to persist across hot reloads in development
const scanSessions = globalThis.scanSessions || new Map<string, { device: { type: string; platform: string } | null; timestamp: number }>();
if (!globalThis.scanSessions) {
  globalThis.scanSessions = scanSessions;
  
  // Cleanup old sessions (older than 5 minutes)
  if (!globalThis.scanSessionsCleanup) {
    globalThis.scanSessionsCleanup = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, data] of scanSessions.entries()) {
        if (now - data.timestamp > 5 * 60 * 1000) {
          scanSessions.delete(sessionId);
        }
      }
    }, 60000); // Run cleanup every minute
  }
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

    // Detect device dari User-Agent dan headers
    const userAgent = request.headers.get('user-agent') || '';
    const customAppHeader = request.headers.get('x-app-platform');
    
    let platform = 'unknown';
    let type = 'browser';

    // Check jika ada custom header dari app
    if (customAppHeader) {
      platform = customAppHeader.toLowerCase();
      type = 'app';
    } else {
      // Detect dari User-Agent
      const ua = userAgent.toLowerCase();
      
      if (ua.includes('android')) {
        platform = 'android';
        type = 'mobile';
      } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        platform = 'ios';
        type = 'mobile';
      } else if (ua.includes('windows')) {
        platform = 'windows';
        type = 'desktop';
      } else if (ua.includes('mac')) {
        platform = 'mac';
        type = 'desktop';
      } else if (ua.includes('linux')) {
        platform = 'linux';
        type = 'desktop';
      }
    }

    // Simpan detection result
    scanSessions.set(sessionId, {
      device: {
        type,
        platform,
      },
      timestamp: Date.now(),
    });

    // Return HTML page untuk redirect atau info
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Terdeteksi</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
    }
    h1 { margin: 0 0 1rem 0; }
    .info {
      background: rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Device Terdeteksi!</h1>
    <div class="info">
      <p><strong>Platform:</strong> ${platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : platform}</p>
      <p><strong>Type:</strong> ${type === 'app' ? 'App' : type === 'mobile' ? 'Mobile Browser' : 'Desktop Browser'}</p>
    </div>
    <p style="margin-top: 1rem; opacity: 0.8;">Anda dapat menutup halaman ini</p>
  </div>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('Error in scan route:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses scan' },
      { status: 500 }
    );
  }
}

