import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export async function GET(request: NextRequest) {
  const apiKey = process.env.ABLY_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Ably not configured' },
      { status: 503 }
    );
  }

  try {
    const ably = new Ably.Rest({ key: apiKey });
    
    // Create a token with limited capabilities
    const tokenRequest = await ably.auth.createTokenRequest({
      capability: {
        'battle:*': ['subscribe', 'presence'],
        'leaderboard': ['subscribe'],
      },
      ttl: 3600 * 1000, // 1 hour
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Ably token error:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
