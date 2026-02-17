/**
 * Syntax highlight a JSON object for display in HTML
 */
function syntaxHighlight(obj) {
  let json;
  if (typeof obj === 'string') {
    try { json = JSON.stringify(JSON.parse(obj), null, 2); }
    catch { json = obj; }
  } else {
    json = JSON.stringify(obj, null, 2);
  }
  if (!json) return '';
  return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
    .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

/**
 * Extract a human-readable message from a log payload
 */
function extractMessage(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload.substring(0, 200);
  if (payload.message) return String(payload.message).substring(0, 200);
  if (payload.entries && Array.isArray(payload.entries)) {
    const entry = payload.entries[0];
    if (entry && entry.info && entry.info.nodeType) {
      return entry.info.nodeType + (entry.info.displayName ? ': ' + entry.info.displayName : '');
    }
  }
  if (payload.http && payload.http.request) {
    const req = payload.http.request;
    return (req.method || '') + ' ' + (req.path || '');
  }
  if (payload.response && payload.response.status) {
    return 'Status: ' + payload.response.status + (payload.response.detail ? ' - ' + payload.response.detail : '');
  }
  const keys = Object.keys(payload).filter(k => !['timestamp', 'level', 'logger', 'transactionId', 'source', 'topic'].includes(k));
  if (keys.length > 0) {
    const val = payload[keys[0]];
    if (typeof val === 'string') return val.substring(0, 200);
  }
  return JSON.stringify(payload).substring(0, 120) + '...';
}

/**
 * Format source badge text
 */
function formatSource(source) {
  if (!source) return '?';
  return source.replace('am-', 'AM ').replace('idm-', 'IDM ').replace('ctsstore', 'CTS').replace('userstore', 'USR');
}
