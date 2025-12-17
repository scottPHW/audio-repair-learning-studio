// main.js - Electron main process for Audio Repair Studio

console.log('=== MAIN.JS STARTING ===');
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron || 'not available');

import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(process.cwd(), '.cursor');
const logPath = path.join(logDir, 'debug.log');

// #region agent log
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:10',message:'Module loaded, paths initialized',data:{__dirname,__filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
} catch(e) {
  console.error('Log error:', e.message);
}
// #endregion

let mainWindow;

const createWindow = () => {
  // #region agent log
  const preloadPath = path.join(__dirname, 'preload.js');
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const htmlPath = path.join(__dirname, '../ui/index.html');
  console.log('createWindow called, paths:', { preloadPath, iconPath, htmlPath });
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:26',message:'createWindow called, calculating paths',data:{__dirname,preloadPath,iconPath,htmlPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
  } catch(e) {
    console.error('Log error in createWindow:', e.message);
  }
  // #endregion
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // #region agent log
  console.log('BrowserWindow created');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:48',message:'BrowserWindow created',data:{iconPath:path.join(__dirname, '../../assets/icon.png')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
  } catch(e) {
    console.error('Log error:', e.message);
  }
  // #endregion

  // #region agent log
  console.log('Loading HTML file:', htmlPath);
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:56',message:'Loading HTML file',data:{htmlPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
  } catch(e) {
    console.error('Log error:', e.message);
  }
  // #endregion
  mainWindow.loadFile(htmlPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // #region agent log
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
    try {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(logPath, JSON.stringify({location:'main.js:64',message:'Page failed to load',data:{errorCode,errorDescription,validatedURL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
    } catch(e) { console.error('Log error:', e.message); }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading:', mainWindow.webContents.getURL());
    try {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(logPath, JSON.stringify({location:'main.js:70',message:'Page finished loading',data:{url:mainWindow.webContents.getURL()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
    } catch(e) { console.error('Log error:', e.message); }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    // Log all console messages (not just errors) to capture script loading status
    console.log(`[Renderer ${level === 0 ? 'LOG' : level === 1 ? 'INFO' : level === 2 ? 'WARN' : 'ERROR'}]`, message);
    try {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(logPath, JSON.stringify({location:'main.js:80',message:'Renderer console message',data:{level,message,line,sourceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e) { console.error('Log error:', e.message); }
  });
  // #endregion

  createMenu();
};

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// #region agent log
app.on('ready', () => {
  console.log('Electron app ready event fired');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:128',message:'App ready event fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
  } catch(e) {
    console.error('Log error in ready handler:', e.message);
  }
  createWindow();
});
// #endregion

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// #region agent log
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:147',message:'Uncaught exception',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
  } catch(e) {
    console.error('Log error in uncaughtException:', e.message);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:154',message:'Unhandled rejection',data:{reason:String(reason)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
  } catch(e) {
    console.error('Log error in unhandledRejection:', e.message);
  }
});
// #endregion
