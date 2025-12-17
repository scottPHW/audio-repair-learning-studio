import { app } from "electron";
console.log("Test: Electron module loaded");
app.whenReady().then(() => {
  console.log("Test: App ready");
  app.quit();
});
