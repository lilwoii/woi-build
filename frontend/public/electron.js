// public/electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // In dev, you *can* point at the CRA dev server if you want:
  //   $env:ELECTRON_START_URL="http://localhost:3000"
  if (!app.isPackaged && process.env.ELECTRON_START_URL) {
    console.log('Loading dev URL:', process.env.ELECTRON_START_URL);
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'build', 'index.html');
    console.log('Loading file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Open devtools so we can see React errors
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    console.error('did-fail-load:', errorCode, errorDesc);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
