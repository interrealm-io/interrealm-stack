const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 5000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Activity monitoring state
const activityEvents = [];
const MAX_EVENTS = 500;
let monitoringEnabled = true;

function addEvent(event) {
  if (monitoringEnabled) {
    activityEvents.push({
      ...event,
      timestamp: new Date().toISOString()
    });

    // Keep only last MAX_EVENTS
    if (activityEvents.length > MAX_EVENTS) {
      activityEvents.shift();
    }

    // Broadcast to all connected monitor clients
    broadcastEvent(event);
  }
}

function broadcastEvent(event) {
  const message = JSON.stringify({
    type: 'event',
    event: {
      ...event,
      timestamp: new Date().toISOString()
    }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    }
  });
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/monitor' });

  wss.on('connection', (ws) => {
    console.log('Monitor client connected');

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'status',
      enabled: monitoringEnabled
    }));

    // Send event history
    ws.send(JSON.stringify({
      type: 'history',
      events: activityEvents
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.command) {
          case 'enable':
            monitoringEnabled = true;
            wss.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'status', enabled: true }));
              }
            });
            break;

          case 'disable':
            monitoringEnabled = false;
            wss.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'status', enabled: false }));
              }
            });
            break;

          case 'status':
            ws.send(JSON.stringify({ type: 'status', enabled: monitoringEnabled }));
            break;

          case 'clear':
            activityEvents.length = 0;
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Monitor client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket monitor on ws://${hostname}:${port}/monitor`);
  });
});
