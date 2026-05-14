// websocket.js
// Manages connection to the Python server
// Auto-reconnects with a 2 second delay

const WS_PORT          = 8765;
const RECONNECT_DELAY  = 2000; // ms

let ws              = null;
let reconnectTimer  = null;
let _callbacks      = {};

// connect to ws with callbacks
// callbacks.onMessage(data) - called with parsed JSON
// callbacks.onOpen() - called when connected
// callbacks.onClose() - called when disconnected
export function connectWS(callbacks) {
  _callbacks = callbacks;
  _connect();
}

function _buildURL() {
  // Works whether the page is opened via HTTP server or local file
  const host = location.hostname || 'localhost';
  return `ws://${host}:${WS_PORT}`;
}

function _connect() {
  clearTimeout(reconnectTimer);
  if (ws) { ws.close(); ws = null; }

  ws = new WebSocket(_buildURL());

  ws.addEventListener('open', () => {
    _callbacks.onOpen?.();
  });

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      _callbacks.onMessage?.(data);
    } catch (err) {
      console.warn('[ws] JSON parse error:', err);
    }
  });

  ws.addEventListener('close', () => {
    _callbacks.onClose?.();
    reconnectTimer = setTimeout(_connect, RECONNECT_DELAY);
  });

  ws.addEventListener('error', () => {
    // Let the 'close' event fire and handle reconnect there
    ws.close();
  });
}