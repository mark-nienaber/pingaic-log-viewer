const LogClient = require('../api/logClient');
const RateLimiter = require('../api/rateLimiter');
const noiseData = require('../data/categories.json');

class TailManager {
  constructor(ws) {
    this.ws = ws;
    this.logClient = null;
    this.rateLimiter = new RateLimiter();
    this.polling = false;
    this.cookie = null;
    this.pollFrequency = 10000;
    this.noiseFilter = true;
    this._noiseLoggers = this._buildNoiseList();
    this._pollTimer = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        this.handleMessage(msg);
      } catch (e) {
        this._send({ type: 'error', error: 'Invalid message format' });
      }
    });

    ws.on('close', () => this.stop());
    ws.on('error', () => this.stop());
  }

  _buildNoiseList() {
    const list = [];
    if (noiseData.noiseFilters) {
      for (const source of Object.values(noiseData.noiseFilters)) {
        for (const loggers of Object.values(source)) {
          list.push(...loggers);
        }
      }
    }
    return list;
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'connect':
        this.logClient = new LogClient({
          origin: msg.origin,
          apiKey: msg.apiKey,
          apiSecret: msg.apiSecret,
          customHeaders: msg.customHeaders || {}
        });
        this._send({ type: 'connected' });
        break;

      case 'start_tail':
        this.noiseFilter = msg.noiseFilter !== false;
        this.pollFrequency = (msg.pollFrequency || 10) * 1000;
        this.cookie = null;
        this.sources = (msg.sources || ['am-everything', 'idm-everything']).join(',');
        this.start();
        break;

      case 'stop_tail':
        this.stop();
        break;

      case 'update_filters':
        this.noiseFilter = msg.noiseFilter !== false;
        break;
    }
  }

  start() {
    if (!this.logClient) {
      this._send({ type: 'error', error: 'Not connected' });
      return;
    }
    this.polling = true;
    this.poll();
  }

  stop() {
    this.polling = false;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async poll() {
    if (!this.polling || this.ws.readyState !== 1) return;

    try {
      const result = await this.logClient.tail(this.sources, this.cookie);
      this.rateLimiter.update(result.rateLimit);

      if (result.data.pagedResultsCookie) {
        this.cookie = result.data.pagedResultsCookie;
      }

      const logs = this._processLogs(result.data.result || []);

      this._send({
        type: 'logs',
        logs,
        rateLimit: this.rateLimiter.getStatus(),
        resultCount: result.data.resultCount
      });

    } catch (e) {
      const errMsg = e.data ? `API error ${e.statusCode}: ${JSON.stringify(e.data)}` : (e.error || 'Unknown error');
      this._send({ type: 'error', error: errMsg });
    }

    // Schedule next poll
    const delay = this.rateLimiter.getDelay(this.pollFrequency);
    this._pollTimer = setTimeout(() => this.poll(), delay);
  }

  _processLogs(rawLogs) {
    const processed = [];
    for (const raw of rawLogs) {
      const payload = raw.payload;
      if (!payload) continue;

      // Handle both JSON and plaintext payloads
      const p = typeof payload === 'string' ? { message: payload } : payload;

      // Apply noise filter
      if (this.noiseFilter && p.logger && this._noiseLoggers.includes(p.logger)) {
        continue;
      }
      // Also filter noise by type (e.g., 'text/plain' entries that are noise)
      if (this.noiseFilter && raw.type === 'text/plain' && this._noiseLoggers.includes('text/plain')) {
        continue;
      }

      processed.push({
        timestamp: raw.timestamp || p.timestamp || '',
        source: raw.source || '',
        type: raw.type || '',
        level: p.level || p.severity || '',
        logger: p.logger || p.eventName || p.component || p.topic || raw.type || '',
        transactionId: p.transactionId || p.trackingIds?.[0] || '',
        message: this._extractMessage(p),
        payload: p
      });
    }
    return processed;
  }

  _extractMessage(payload) {
    if (typeof payload === 'string') return payload.substring(0, 300);
    if (payload.message) return String(payload.message).substring(0, 300);
    if (payload.entries && Array.isArray(payload.entries) && payload.entries.length > 0) {
      const entry = payload.entries[0];
      if (entry.info && entry.info.nodeType) {
        return entry.info.nodeType + (entry.info.displayName ? ': ' + entry.info.displayName : '');
      }
    }
    if (payload.http && payload.http.request) {
      const req = payload.http.request;
      return (req.method || '') + ' ' + (req.path || '');
    }
    return '';
  }

  _send(data) {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

module.exports = TailManager;
