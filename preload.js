// preload.js - Security bridge between Electron main and renderer

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    name: 'Audio Repair Studio',
    version: '1.0.0'
  }
});
