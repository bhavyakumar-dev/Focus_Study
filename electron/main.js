import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    kiosk: true, // This locks the app to fullscreen and heavily restricts OS navigation!
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Depending on whether we're running in dev or prod:
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load the local production build
    mainWindow.loadFile(path.join(__dirname, '../production/index.html'));
  }

  // Aggressively intercept Alt+Tab globally if possible (Windows doesn't allow overriding Alt+Tab easily, 
  // but kiosk mode is usually enough). We can block Alt+F4.
  mainWindow.on('close', (e) => {
    // For a real lockdown app, you might prevent closing unless a condition is met
    // e.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Try to register some global shortcuts to block them
  globalShortcut.register('CommandOrControl+Tab', () => {
    console.log('Ctrl+Tab blocked by Focus Core');
  });
  globalShortcut.register('Alt+Tab', () => {
    console.log('Alt+Tab attempt detected');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
