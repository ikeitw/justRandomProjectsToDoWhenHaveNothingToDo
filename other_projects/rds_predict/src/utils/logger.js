/**
 * Secure logger that hides sensitive tokens in output
 */

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const levelNames = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

function maskSensitiveData(text) {
  if (typeof text !== 'string') {
    return text;
  }

  // Mask Bearer tokens
  text = text.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');

  // Mask GitHub tokens (common patterns)
  text = text.replace(/gh[pousr]{2}_[A-Za-z0-9_]{36,255}/gi, 'gh[REDACTED]');

  // Mask generic tokens in JSON
  text = text.replace(/"token"\s*:\s*"[^"]+"/gi, '"token": "[REDACTED]"');
  text = text.replace(/"api[_-]?key"\s*:\s*"[^"]+"/gi, '"api_key": "[REDACTED]"');

  return text;
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelName = levelNames[level] || 'INFO';

  let output = `[${timestamp}] ${levelName}: ${message}`;

  if (data) {
    let dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    dataStr = maskSensitiveData(dataStr);
    output += `\n${dataStr}`;
  }

  if (level === LogLevel.ERROR) {
    console.error(output);
  } else if (level === LogLevel.WARN) {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  error: (message, data) => log(LogLevel.ERROR, message, data),
  warn: (message, data) => log(LogLevel.WARN, message, data),
  info: (message, data) => log(LogLevel.INFO, message, data),
  debug: (message, data) => log(LogLevel.DEBUG, message, data),
};

export default logger;

