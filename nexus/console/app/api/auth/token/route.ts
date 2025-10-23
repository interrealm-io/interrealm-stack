import { NextRequest, NextResponse } from 'next/server';

// This API route proxies authentication requests to the Nexus server
// The Nexus server validates the API token and returns a JWT

export async function POST(request: NextRequest) {
  console.log('[Console Auth API] POST /api/auth/token - Request received');

  try {
    const body = await request.json();
    const { apiToken } = body;

    console.log('[Console Auth API] API Token received, length:', apiToken?.length || 0);

    if (!apiToken) {
      console.error('[Console Auth API] No API token provided');
      return NextResponse.json(
        { success: false, error: 'API token is required' },
        { status: 400 }
      );
    }

    // Call the Nexus server auth endpoint (same endpoint, just proxying)
    const nexusAuthUrl = process.env.NEXUS_AUTH_URL;

    if (!nexusAuthUrl) {
      console.error('[Console Auth API] NEXUS_AUTH_URL environment variable not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('[Console Auth API] Proxying to Nexus server:', nexusAuthUrl);

    const nexusResponse = await fetch(nexusAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiToken }),
    });

    console.log('[Console Auth API] Nexus response status:', nexusResponse.status);
    console.log('[Console Auth API] Nexus response ok:', nexusResponse.ok);

    const responseText = await nexusResponse.text();
    console.log('[Console Auth API] Nexus response body:', responseText);

    let nexusData;
    try {
      nexusData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Console Auth API] Failed to parse Nexus response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid response from authentication server' },
        { status: 500 }
      );
    }

    if (!nexusResponse.ok) {
      console.error('[Console Auth API] Nexus auth failed:', nexusData);
      return NextResponse.json(
        { success: false, error: nexusData.error || 'Authentication failed' },
        { status: nexusResponse.status }
      );
    }

    console.log('[Console Auth API] Nexus auth successful');
    console.log('[Console Auth API] Response data:', { success: nexusData.success, hasToken: !!nexusData.token });

    // Return the exact response from Nexus
    return NextResponse.json(nexusData);

  } catch (error) {
    console.error('[Console Auth API] Error during authentication:', error);
    if (error instanceof Error) {
      console.error('[Console Auth API] Error message:', error.message);
      console.error('[Console Auth API] Error stack:', error.stack);
    }
    return NextResponse.json(
      { success: false, error: 'Authentication service error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
