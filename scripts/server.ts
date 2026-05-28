import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../src');
const PORT = parseInt(process.env.DEV_SERVER_PORT || '3001', 10);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const urlPath = req.url || '/';
  console.log(`[Dev Server] Request: ${urlPath}`);

  let filePath = path.join(publicDir, urlPath === '/' ? 'index.html' : urlPath);
  filePath = path.resolve(filePath);
  if (!filePath.startsWith(path.resolve(publicDir))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error: NodeJS.ErrnoException | null, content: Buffer) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Dev Server] Running at http://localhost:${PORT}`);
});
