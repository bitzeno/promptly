const { app, BrowserWindow, globalShortcut, clipboard, dialog } = require("electron");

try {
  require("electron-reloader")(module, {
    watchRenderer: true,
  });
} catch (_) {}
const path = require("path");
const {
  simulatePaste,
  saveFrontmostApp,
  activatePreviousApp,
} = require("./build/Release/paste.node");

let win = null;

function createWindow() {
  if (win) {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, "screen-saver");
    win.show();
    win.focus();
    return;
  }

  const { screen } = require("electron");
  const display = screen.getPrimaryDisplay();
  const { width } = display.workAreaSize;

  const winWidth = 680;

  win = new BrowserWindow({
    width: winWidth,
    height: 400,
    x: Math.round((width - winWidth) / 2),
    y: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Float above fullscreen apps
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(true, "screen-saver");

  win.loadFile("index.html");

  ipcMain.once("ready", () => {
    win.show();
  });

  win.on("blur", () => {
    hideWindow();
  });

  win.on("closed", () => {
    win = null;
  });
}

function hideWindow() {
  if (win && win.isVisible()) {
    win.hide();
  }
}

function pasteText(text) {
  clipboard.writeText(text);
  hideWindow();
  activatePreviousApp();

  // Brief delay for the target app to accept focus, then Cmd+V
  setTimeout(() => {
    simulatePaste();
  }, 50);
}

const { ipcMain } = require("electron");
const db = require("./db");

ipcMain.handle("get-all-prompts", () => {
  return db.getAllPrompts();
});

ipcMain.handle("search-prompts", (_event, query) => {
  return db.searchPrompts(query);
});

ipcMain.handle("create-prompt", (_event, name, text) => {
  db.createPrompt(name, text);
});

ipcMain.handle("update-prompt", (_event, id, name, text) => {
  db.updatePrompt(id, name, text);
});

ipcMain.handle("delete-prompt", (_event, id) => {
  db.deletePrompt(id);
});

ipcMain.handle("reorder-prompts", (_event, orderedIds) => {
  db.reorderPrompts(orderedIds);
});

ipcMain.handle("get-theme", () => {
  return db.getSetting("theme") || "dark";
});

ipcMain.handle("set-theme", (_event, theme) => {
  db.setSetting("theme", theme);
});

ipcMain.on("resize", (_event, contentHeight) => {
  if (win) {
    const { screen } = require("electron");
    const display = screen.getPrimaryDisplay();
    const maxHeight = Math.round(display.workAreaSize.height * 0.7);
    const height = Math.min(contentHeight, maxHeight);
    win.setSize(680, height);
  }
});

ipcMain.on("submit", (_event, text) => {
  pasteText(text);
});

ipcMain.on("escape", () => {
  hideWindow();
  activatePreviousApp();
});

app.whenReady().then(() => {
  // Check and prompt for Accessibility permission
  const { systemPreferences } = require("electron");
  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (!trusted) {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Promptly needs Accessibility access",
      message: "Promptly needs Accessibility access",
      detail: "Promptly pastes text into your active app using a keyboard shortcut. macOS requires Accessibility permission for this.\n\nClick OK, then toggle Promptly on in the System Settings window that appears. You may need to restart the app after granting permission.",
      buttons: ["OK"],
    });
    systemPreferences.isTrustedAccessibilityClient(true);
  }

  // Open at login
  app.setLoginItemSettings({ openAtLogin: true });

  // Seed database on first run
  db.seed();

  // Hide dock icon — this is a background/utility app
  app.dock.hide();

  globalShortcut.register("Command+Shift+Space", () => {
    saveFrontmostApp();
    createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", (e) => {
  // Prevent app from quitting when window closes
  e.preventDefault();
});
