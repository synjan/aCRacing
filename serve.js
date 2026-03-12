// serve.js – Lokal dev-server for servere.html med CORS-proxy til AC-serverne
// Bruk: node serve.js
// Åpner http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const SERVER_IP = '46.225.176.106';
const API_MAP = {
  '/api/trackday': 9680,
  '/api/mx5cup': 9690,
  '/api/gt3': 9700,
};

const server = http.createServer((req, res) => {
  // API-proxy
  if (API_MAP[req.url]) {
    const port = API_MAP[req.url];
    const proxy = http.get(`http://${SERVER_IP}:${port}/INFO`, (upstream) => {
      res.writeHead(upstream.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      upstream.pipe(res);
    });
    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end('{"error":"Server ikke tilgjengelig"}');
    });
    proxy.setTimeout(5000, () => {
      proxy.destroy();
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end('{"error":"Timeout"}');
    });
    return;
  }

  // Serve servere.html som index
  let filePath = req.url === '/' ? '/servere.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
});
