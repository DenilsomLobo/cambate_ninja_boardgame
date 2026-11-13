import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';

const root = path.resolve('public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const port = Number(process.env.PORT || 5173);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.resolve(root, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('Arquivo não encontrado');
  }
});

server.on('error', error => {
  console.error(`Falha ao iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  console.log(`Combate Ninja Board Game: ${url}`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    execFile('cmd.exe', ['/d', '/c', 'start', '""', url], { windowsHide: true }, error => {
      if (error) console.error(`Abra o endereço acima no navegador. ${error.message}`);
    });
  }
});
