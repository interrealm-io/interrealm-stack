import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/agent-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId' },
        { status: 400 }
      );
    }

    // Check if agent is running
    if (!agentManager.isAgentRunning(agentId)) {
      return NextResponse.json(
        { error: 'Agent is not running' },
        { status: 404 }
      );
    }

    // Stop the agent
    await agentManager.stopAgent(agentId);

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} stopped successfully`,
    });
  } catch (error) {
    console.error('Error stopping agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop agent' },
      { status: 500 }
    );
  }
}
