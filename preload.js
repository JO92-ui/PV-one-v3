const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pv', {
  patients: {
    pickDir: async ()=> { return await ipcRenderer.invoke('patients-pickDir'); },
    setDir: async (dir)=> { return await ipcRenderer.invoke('patients-setDir', dir); },
    list: async ()=> { return await ipcRenderer.invoke('patients-list'); },
    load: async (filename)=> { return await ipcRenderer.invoke('patients-load', filename); },
    save: async (opts)=> { return await ipcRenderer.invoke('patients-save', opts); },
    delete: async (filename)=> { return await ipcRenderer.invoke('patients-delete', filename); },
    getDir: async ()=> { return await ipcRenderer.invoke('patients-getDir'); }
  }
});
