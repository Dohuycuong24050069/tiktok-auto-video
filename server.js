const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Admin', 'Desktop', 'tiktok-auto-video', 'preview.html');
const server = http.createServer((req, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Error loading file');
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(data);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('TikTok Auto Video Tool preview server running at http://localhost:3000');
});
