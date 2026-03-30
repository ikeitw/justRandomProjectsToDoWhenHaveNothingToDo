// main.js
// Entry point - connects websocket to UI updates

import { connectWS }             from './websocket.js';
import { applyState, setOnline, showWaiting } from './ui.js';

// Start connected = false
showWaiting(true);
setOnline(false);

connectWS({
  onOpen() {
    setOnline(true);
    showWaiting(false);
    console.info('[main] Connected to telemetry server.');
  },

  onMessage(data) {
    applyState(data);
  },

  onClose() {
    setOnline(false);
    showWaiting(true);
    console.info('[main] Disconnected — reconnecting…');
  },
});