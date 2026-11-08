const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startLocalStaticServer() {
  return new Promise((resolve) => {
    const candidates = [
      path.join(__dirname, '../dist'),
      path.join(__dirname, 'dist'),
      path.join(process.resourcesPath || '', 'app/dist'),
      path.join(process.resourcesPath || '', 'dist')
    ];
    const distDir = candidates.find(dir => fs.existsSync(path.join(dir, 'index.html')));

    if (!distDir) {
      console.warn('Local dist/index.html not found, will load live URL directly');
      return resolve(null);
    }

    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/' || !reqPath) reqPath = '/index.html';

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Local static server running at http://127.0.0.1:${port}`);
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });

    server.on('error', (err) => {
      console.error('Local server error:', err);
      resolve(null);
    });
  });
}

let mainWindow = null;
let localServerInstance = null;

async function createWindow() {
  const local = await startLocalStaticServer();
  localServerInstance = local ? local.server : null;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Smart Mess Management System',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  Menu.setApplicationMenu(null);

  const targetUrl = local ? local.url : 'https://smartmess-system.vercel.app';
  console.log('Loading URL:', targetUrl);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Load failed, falling back to live web portal:', errorCode, errorDescription);
    mainWindow.loadURL('https://smartmess-system.vercel.app');
  });

  mainWindow.loadURL(targetUrl);

  // Enable F12 and Ctrl+R for debugging and refresh
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      mainWindow.webContents.reload();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (localServerInstance) {
    try { localServerInstance.close(); } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
