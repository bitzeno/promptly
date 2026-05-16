const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("promptly", {
  submit: (text) => ipcRenderer.send("submit", text),
  escape: () => ipcRenderer.send("escape"),
  resize: (height) => ipcRenderer.send("resize", height),
  getAllPrompts: () => ipcRenderer.invoke("get-all-prompts"),
  searchPrompts: (query) => ipcRenderer.invoke("search-prompts", query),
  createPrompt: (name, text) => ipcRenderer.invoke("create-prompt", name, text),
  updatePrompt: (id, name, text) => ipcRenderer.invoke("update-prompt", id, name, text),
  deletePrompt: (id) => ipcRenderer.invoke("delete-prompt", id),
  reorderPrompts: (orderedIds) => ipcRenderer.invoke("reorder-prompts", orderedIds),
  ready: () => ipcRenderer.send("ready"),
  getTheme: () => ipcRenderer.invoke("get-theme"),
  setTheme: (theme) => ipcRenderer.invoke("set-theme", theme),
});
