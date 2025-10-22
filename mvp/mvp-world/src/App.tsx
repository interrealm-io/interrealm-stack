import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ActivityEvent, MonitorMessage } from './types'
import { RoutingPolicyManager } from './components/RoutingPolicyManager'

function App() {
  const [activeView, setActiveView] = useState<'monitor' | 'routing'>('monitor');
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState<string>('Disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number>();
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(false);

  const connect = () => {
    // Prevent double connection attempts - also check for CONNECTING state
    if (isConnectingRef.current ||
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🚫 Connection already in progress or established');
      return;
    }

    // Clear any pending reconnection attempts before starting new connection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    isConnectingRef.current = true;
    setWsStatus('Connecting...');
    console.log('🔄 Initiating WebSocket connection...');

    try {
      const ws = new WebSocket('ws://localhost:4000/monitor');

      ws.onopen = () => {
        console.log('✅ Connected to nexus monitor');
        isConnectingRef.current = false;
        setIsConnected(true);
        setWsStatus('Connected');
        setEvents(prev => [...prev, {
          timestamp: new Date().toISOString(),
          type: 'connection',
          level: 'info',
          message: 'Connected to Nexus Monitor'
        }]);
      };

      ws.onmessage = (event) => {
        try {
          const message: MonitorMessage = JSON.parse(event.data);

          if (message.type === 'event' && message.event) {
            setEvents(prev => [...prev, message.event!]);
          } else if (message.type === 'history' && message.events) {
            setEvents(prev => [...prev, ...message.events!]);
          } else if (message.type === 'status') {
            console.log('Monitor status:', message);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsStatus('Error');
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('🔌 Disconnected from nexus monitor', event.code, event.reason);
        isConnectingRef.current = false;
        setIsConnected(false);
        setWsStatus('Disconnected');

        // Only add disconnection event if it wasn't a clean unmount
        if (isMountedRef.current && event.code !== 1000) {
          setEvents(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: 'disconnection',
            level: 'warn',
            message: `Disconnected from Nexus Monitor (code: ${event.code})`
          }]);
        }

        // Only attempt reconnect if component is still mounted and not a normal closure
        if (isMountedRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            setWsStatus('Reconnecting...');
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
      setWsStatus('Failed to connect');
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    // Prevent double connection in StrictMode
    if (isMountedRef.current) {
      console.log('🚫 Effect already executed (StrictMode)');
      return;
    }

    isMountedRef.current = true;
    connect();

    // CRITICAL: Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      isMountedRef.current = false;
      isConnectingRef.current = false;

      // Clear any pending reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      // Close WebSocket gracefully
      if (wsRef.current) {
        const currentWs = wsRef.current;
        // Remove event listeners to prevent reconnection attempts during cleanup
        currentWs.onclose = null;
        currentWs.onerror = null;
        currentWs.onopen = null;
        currentWs.onmessage = null;

        if (currentWs.readyState === WebSocket.OPEN ||
            currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.close(1000, 'Component unmounting');
        }
        wsRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events]);

  const getEventColor = (level: string): string => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      case 'info': return '#00ff00';
      case 'debug': return '#888888';
      default: return '#00ff00';
    }
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'connection': return '🔌';
      case 'disconnection': return '🔴';
      case 'handshake': return '🤝';
      case 'message': return '📨';
      case 'event': return '⚡';
      case 'error': return '❌';
      case 'routing': return '🔀';
      default: return '•';
    }
  };

  const clearLogs = () => {
    setEvents([]);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🌐 NEXUS CONTROL CENTER</h1>
        <div className="nav-bar">
          <button
            className={`nav-btn ${activeView === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveView('monitor')}
          >
            Monitor
          </button>
          <button
            className={`nav-btn ${activeView === 'routing' ? 'active' : ''}`}
            onClick={() => setActiveView('routing')}
          >
            Routing & Policies
          </button>
        </div>
        {activeView === 'monitor' && (
          <div className="status-bar">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '●' : '○'}
            </span>
            <span className="status-text">{wsStatus}</span>
            <span className="event-count">{events.length} events</span>
            <button className="clear-btn" onClick={clearLogs}>Clear</button>
          </div>
        )}
      </div>

      {activeView === 'monitor' && (
        <div className="monitor-view">
          <div className="terminal" ref={terminalRef}>
            <div className="terminal-content">
              {events.length === 0 && (
                <div className="welcome">
                  <p>Waiting for events from Nexus server...</p>
                  <p className="hint">Make sure the Nexus server is running on port 4000</p>
                </div>
              )}
              {events.map((event, index) => (
                <div key={index} className="event-line">
                  <span className="timestamp">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  <span className="icon">{getEventIcon(event.type)}</span>
                  <span className="type">[{event.type.toUpperCase()}]</span>
                  {event.memberId && <span className="member-id">({event.memberId})</span>}
                  <span className="message" style={{ color: getEventColor(event.level) }}>
                    {event.message}
                  </span>
                  {event.data && (
                    <span className="data"> {JSON.stringify(event.data)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="footer">
            <span>InterRealm Nexus Activity Monitor v1.0</span>
            <span>ws://localhost:4000/monitor</span>
          </div>
        </div>
      )}

      {activeView === 'routing' && (
        <div className="routing-view">
          <RoutingPolicyManager />
        </div>
      )}
    </div>
  )
}

export default App
