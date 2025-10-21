'use client';

import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ActivityEvent {
  timestamp: string;
  type: 'connection' | 'disconnection' | 'handshake' | 'message' | 'event' | 'error' | 'routing';
  level: 'info' | 'warn' | 'error' | 'debug';
  memberId?: string;
  realmId?: string;
  message: string;
  data?: any;
}

export default function MonitorPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/monitor');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Monitor connected');
      setIsConnected(true);
      // Request status
      ws.send(JSON.stringify({ command: 'status' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'event') {
        setEvents(prev => [...prev, data.event].slice(-200)); // Keep last 200
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
    <div className="flex h-screen flex-col bg-black text-green-400 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-800 p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Nexus Activity Monitor</h1>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </Badge>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Monitoring Enabled' : 'Monitoring Disabled'}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={toggleMonitoring}
            disabled={!isConnected}
            variant="outline"
            size="sm"
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            onClick={clearEvents}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            variant={autoScroll ? 'default' : 'outline'}
            size="sm"
          >
            Auto-scroll
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-6 border-b border-green-800 px-4 py-2 text-sm">
        <span>Events: {events.length}</span>
        <span>Connections: {events.filter(e => e.type === 'connection').length}</span>
        <span>Events Pub: {events.filter(e => e.type === 'event').length}</span>
        <span>Errors: {events.filter(e => e.type === 'error').length}</span>
      </div>

      {/* Event Stream */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div ref={scrollRef} className="space-y-1">
            {events.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                Waiting for activity...
              </div>
            ) : (
              events.map((event, i) => (
                <div
                  key={i}
                  className="group flex gap-3 rounded px-2 py-1 hover:bg-green-950/30"
                >
                  <span className="text-gray-600 w-32 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}.{String(new Date(event.timestamp).getMilliseconds()).padStart(3, '0')}
                  </span>

                  <Badge
                    className={`${getTypeColor(event.type)} w-24 flex-shrink-0 justify-center font-mono text-xs`}
                    variant="outline"
                  >
                    {event.type.toUpperCase()}
                  </Badge>

                  <span className="flex-1">
                    <span className={getLevelColor(event.level)}>{event.message}</span>
                    {event.memberId && (
                      <span className="ml-2 text-xs text-gray-600">
                        [{event.memberId}]
                      </span>
                    )}
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
