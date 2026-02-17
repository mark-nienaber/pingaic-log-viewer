const https = require('https');
const http = require('http');
const { URL } = require('url');

class LogClient {
  constructor({ origin, apiKey, apiSecret, customHeaders = {} }) {
    this.origin = origin.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.customHeaders = customHeaders;

    const url = new URL(this.origin);
    this._http = url.protocol === 'https:' ? https : http;
  }

  _buildHeaders() {
    return {
      'x-api-key': this.apiKey,
      'x-api-secret': this.apiSecret,
      ...this.customHeaders
    };
  }

  _request(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.origin);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers: this._buildHeaders()
      };

      const req = this._http.request(options, (res) => {
        const rateLimitHeaders = {
          limit: parseInt(res.headers['x-ratelimit-limit']) || 0,
          remaining: parseInt(res.headers['x-ratelimit-remaining']) || 0,
          reset: parseInt(res.headers['x-ratelimit-reset']) || 0
        };

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { error: 'Invalid JSON response', raw: data.substring(0, 500) };
          }

          if (res.statusCode >= 400) {
            reject({
              statusCode: res.statusCode,
              data: parsed,
              rateLimit: rateLimitHeaders
            });
            return;
          }

          resolve({ data: parsed, rateLimit: rateLimitHeaders, statusCode: res.statusCode });
        });
      });

      req.on('error', (e) => reject({ error: e.message }));
      req.setTimeout(30000, () => { req.destroy(); reject({ error: 'Request timeout' }); });
      req.end();
    });
  }

  async tail(source, cookie) {
    let path = `/monitoring/logs/tail?source=${encodeURIComponent(source)}`;
    if (cookie) {
      path += `&_pagedResultsCookie=${encodeURIComponent(cookie)}`;
    }
    return this._request(path);
  }

  async query({ source, beginTime, endTime, transactionId, queryFilter, cookie }) {
    const params = new URLSearchParams();
    params.set('source', source);
    if (beginTime) params.set('beginTime', beginTime);
    if (endTime) params.set('endTime', endTime);
    if (transactionId) params.set('transactionId', transactionId);
    if (queryFilter) params.set('_queryFilter', queryFilter);
    if (cookie) params.set('_pagedResultsCookie', cookie);
    return this._request(`/monitoring/logs?${params.toString()}`);
  }

  async testConnection() {
    return this.tail('am-everything', null);
  }
}

module.exports = LogClient;
