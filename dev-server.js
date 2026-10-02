/**
 * Local dev server for LogixSense.
 * Serves static files + REST API Endpoints for SQL Database (Oracle/SQLite/JSON) + AI/Weather Proxies.
 *
 * Usage:
 *   1. npm run dev
 *   2. Open http://localhost:8888
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const db = require('./db');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8888;

// Load .env (no extra dependency)
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res, pathname) {
  let filePath = pathname;
  if (filePath === '/') filePath = '/index.html';
  const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(ROOT, safePath);

  if (!abs.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(abs, (err, data) => {
    if (err) {
      if (pathname !== '/index.html' && !pathname.includes('.')) {
        const index = path.join(ROOT, 'index.html');
        fs.readFile(index, (e2, html) => {
          if (e2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end();
      return;
    }

    // ==========================================
    // REST API ENDPOINTS FOR SQL DATABASE
    // ==========================================

    // 1. Database Inspector API Routes
    if (pathname === '/api/db/tables') {
      const info = await db.getTables();
      return sendJson(res, 200, info);
    }
    if (pathname === '/api/db/table') {
      const name = url.searchParams.get('name') || 'shipments';
      const data = await db.getTableData(name);
      return sendJson(res, 200, data);
    }

    // 2. Shipments API Routes
    if (pathname === '/api/shipments') {
      if (req.method === 'GET') {
        const rows = await db.query('SELECT * FROM shipments');
        return sendJson(res, 200, { shipments: rows });
      }
      if (req.method === 'POST') {
        const bodyText = await readBody(req);
        const body = JSON.parse(bodyText || '{}');
        const inserted = await db.insertRecord('shipments', body);
        return sendJson(res, 201, { success: true, shipment: inserted });
      }
    }

    // 3. Alerts / Disruptions API Routes
    if (pathname === '/api/alerts') {
      if (req.method === 'GET') {
        const rows = await db.query('SELECT * FROM alerts');
        return sendJson(res, 200, { alerts: rows });
      }
      if (req.method === 'POST') {
        const bodyText = await readBody(req);
        const body = JSON.parse(bodyText || '{}');
        const inserted = await db.insertRecord('alerts', body);
        return sendJson(res, 201, { success: true, alert: inserted });
      }
    }

    // 4. Stoppages API Routes
    if (pathname === '/api/stoppages') {
      if (req.method === 'GET') {
        const rows = await db.query('SELECT * FROM stoppages');
        return sendJson(res, 200, { stoppages: rows });
      }
      if (req.method === 'POST') {
        const bodyText = await readBody(req);
        const body = JSON.parse(bodyText || '{}');
        const inserted = await db.insertRecord('stoppages', body);
        return sendJson(res, 201, { success: true, stoppage: inserted });
      }
    }

    // 5. Driver Scores & Trip Logs API Routes
    if (pathname === '/api/driver-scores') {
      const rows = await db.query('SELECT * FROM driver_scores');
      return sendJson(res, 200, { driverScores: rows });
    }
    if (pathname === '/api/trip-logs') {
      const rows = await db.query('SELECT * FROM trip_logs');
      return sendJson(res, 200, { tripLogs: rows });
    }

    // 6. Notifications API Routes
    if (pathname === '/api/notifications') {
      if (req.method === 'GET') {
        const rows = await db.query('SELECT * FROM notifications');
        return sendJson(res, 200, { notifications: rows });
      }
      if (req.method === 'POST') {
        const bodyText = await readBody(req);
        const body = JSON.parse(bodyText || '{}');
        const inserted = await db.insertRecord('notifications', body);
        return sendJson(res, 201, { success: true, notification: inserted });
      }
    }

    // 7. SOS Emergency API Routes
    if (pathname === '/api/sos') {
      const bodyText = await readBody(req);
      const body = JSON.parse(bodyText || '{}');
      const inserted = await db.insertRecord('sos_alerts', body);
      return sendJson(res, 201, { success: true, sos: inserted });
    }

    // 8. AI Proxy Endpoint (Groq Primary, Gemini Fallback)
    if (pathname === '/api/gemini' || pathname === '/api/groq' || pathname === '/.netlify/functions/gemini') {
      const groqKey = process.env.GROQ_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      
      const bodyText = await readBody(req);
      const { prompt } = JSON.parse(bodyText || '{}');

      // 1. Try Groq API primary
      if (groqKey) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: 'groq/compound',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2,
              max_completion_tokens: 512
            })
          });
          const groqData = await groqRes.json();
          if (groqRes.ok && groqData?.choices?.[0]?.message?.content) {
            return sendJson(res, 200, { text: groqData.choices[0].message.content });
          }
          console.warn('Groq proxy request failed, trying Gemini fallback...', groqData?.error);
        } catch(e) {
          console.warn('Groq proxy error:', e.message);
        }
      }

      // 2. Try Gemini API fallback
      if (geminiKey) {
        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const geminiData = await geminiRes.json();
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) return sendJson(res, 200, { text });
        } catch(e) {
          console.warn('Gemini proxy fallback error:', e.message);
        }
      }

      return sendJson(res, 200, { text: 'Simulated AI Response: Route risks monitored cleanly in LogixSense.' });
    }

    // 9. Weather Proxy Endpoint
    if (pathname === '/api/weather' || pathname === '/.netlify/functions/weather') {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return sendJson(res, 200, { main: { temp: 28 }, weather: [{ main: 'Clear', description: 'clear sky' }] });
      }
      try {
        const lat = url.searchParams.get('lat') || '13.08';
        const lon = url.searchParams.get('lon') || '80.27';
        const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const wData = await wRes.json();
        return sendJson(res, 200, wData);
      } catch(e) {
        return sendJson(res, 500, { error: e.message });
      }
    }

    // Serve static files for everything else
    serveStatic(req, res, pathname);

  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Server error' }));
  }
});

// Initialize database on startup
db.initDatabase().then(() => {
  let currentPort = PORT;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      currentPort++;
      console.warn(`⚠️ Port in use. Trying alternative port http://localhost:${currentPort} ...`);
      setTimeout(() => server.listen(currentPort), 200);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(currentPort, () => {
    console.log(`\n======================================================`);
    console.log(`LogixSense dev server → http://localhost:${currentPort}`);
    console.log(`SQL Database Inspector → http://localhost:${currentPort}/api/db/tables`);
    console.log(`======================================================\n`);
  });
});
