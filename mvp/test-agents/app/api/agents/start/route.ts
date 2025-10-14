import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/agent-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, config } = body;

    if (!agentId || !config) {
      return NextResponse.json(
        { error: 'Missing agentId or config' },
        { status: 400 }
      );
    }

    if (!config.endpoint || !config.apiKey) {
      return NextResponse.json(
        { error: 'Missing endpoint or apiKey in config' },
        { status: 400 }
      );
    }

    // Check if agent is already running
    if (agentManager.isAgentRunning(agentId)) {
      return NextResponse.json(
        { error: 'Agent is already running' },
        { status: 409 }
      );
    }

    // Start the agent based on agentId
    if (agentId === 'ping-pong') {
      await agentManager.startPingPongAgents(config);
    } else {
      return NextResponse.json(
        { error: `Unknown agent: ${agentId}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} started successfully`,
    });
  } catch (error) {
    console.error('Error starting agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start agent' },
      { status: 500 }
    );
  }
}
