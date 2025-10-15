'use client';

import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgentActivity } from '@/lib/agent-activity-context';

interface ActivityEvent {
  timestamp: string;
  type: 'connection' | 'disconnection' | 'handshake' | 'message' | 'event' | 'error' | 'routing';
  level: 'info' | 'warn' | 'error' | 'debug';
  memberId?: string;
  realmId?: string;
  message: string;
  data?: any;
}

export function ActivityMonitor() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { highlightAgent } = useAgentActivity();

  useEffect(() => {
    // Use environment variable for Nexus server URL, fallback to localhost:3001
    const nexusWsUrl = process.env.NEXT_PUBLIC_NEXUS_WS_URL || 'ws://localhost:3001/gateway';
    const monitorUrl = nexusWsUrl.replace('/gateway', '/monitor');

    const ws = new WebSocket(monitorUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Monitor connected');
      setIsConnected(true);
      ws.send(JSON.stringify({ command: 'status' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'event') {
        const newEvent = data.event;
        setEvents(prev => [...prev, newEvent].slice(-200));

        // Highlight agent card when activity is detected
        if (newEvent.memberId) {
          highlightAgent(newEvent.memberId);
        }
      } else if (data.type === 'history') {
        setEvents(data.events);
      } else if (data.type === 'status') {
        setIsEnabled(data.enabled);
      }
    };

    ws.onclose = () => {
      console.log('Monitor disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('Monitor error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const toggleMonitoring = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        command: isEnabled ? 'disable' : 'enable'
      }));
      setIsEnabled(!isEnabled);
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'connection': return 'bg-green-500/20 text-green-400';
      case 'disconnection': return 'bg-red-500/20 text-red-400';
      case 'handshake': return 'bg-blue-500/20 text-blue-400';
      case 'event': return 'bg-purple-500/20 text-purple-400';
      case 'routing': return 'bg-cyan-500/20 text-cyan-400';
      case 'message': return 'bg-gray-500/20 text-gray-400';
      case 'error': return 'bg-red-600/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Activity Monitor</h2>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? '●' : '○'}
          </Badge>
        </div>

        <div className="flex gap-1">
          <Button
            onClick={toggleMonitoring}
            disabled={!isConnected}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            {isEnabled ? 'Pause' : 'Resume'}
          </Button>
          <Button
            onClick={clearEvents}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            Clear
          </Button>
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            variant={autoScroll ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2 text-xs"
          >
            Auto
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 border-b px-3 py-1.5 text-xs text-muted-foreground">
        <span>Events: {events.length}</span>
        <span>Connections: {events.filter(e => e.type === 'connection').length}</span>
        <span>Errors: {events.filter(e => e.type === 'error').length}</span>
      </div>

      {/* Event Stream */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="space-y-0.5 p-2">
            {events.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Waiting for activity...
              </div>
            ) : (
              events.map((event, i) => (
                <div
                  key={i}
                  className="group flex gap-2 rounded px-2 py-1 text-xs hover:bg-muted/50"
                >
                  <span className="text-muted-foreground w-20 flex-shrink-0 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>

                  <Badge
                    className={`${getTypeColor(event.type)} w-20 flex-shrink-0 justify-center font-mono text-[10px]`}
                    variant="outline"
                  >
                    {event.type.toUpperCase().substring(0, 8)}
                  </Badge>

                  <span className="flex-1 truncate">
                    <span className={getLevelColor(event.level)}>{event.message}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
