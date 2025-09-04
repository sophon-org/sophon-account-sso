import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}

// 🚀 HEAD request for fast health checks (no body needed)
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Health-Status': 'ok',
      'X-Timestamp': Date.now().toString(),
    },
  });
}
