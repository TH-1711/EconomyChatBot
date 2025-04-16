const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const curPath = path.join(__dirname, 'FE/dist/index.html');
  console.log("Loading FE from:", curPath);
  win.loadFile(curPath);
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged;

  const bePath = isDev
    ? path.join(__dirname, '../be/dist/main.js')
    : path.join(__dirname, 'be/dist/main.js');

  console.log("Spawning backend from:", bePath);

  backendProcess = spawn('node', [bePath], { stdio: 'inherit' });
  try {
    console.log("Waiting for backend to be ready...");
    await waitForPort(3001); // Adjust if your backend uses a different port
    console.log("Backend is ready!");
    createWindow();
  } catch (error) {
    console.error("Backend failed to start:", error);
    //app.quit();
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
