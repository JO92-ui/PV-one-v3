const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

let mainWindow = null;
let patientDir = null;

function sanitizeFilename(name){
  return (name||'patient').replace(/[^a-z0-9A-Z\-_. ]+/g,'_').slice(0,200);
}

async function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  // Load local index.html
  const indexPath = path.join(__dirname, 'index.html');
  await mainWindow.loadFile(indexPath);
}

app.whenReady().then(async ()=>{
  await createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for patient file operations
ipcMain.handle('patients-pickDir', async (ev)=>{
  try{
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if(res.canceled) return { ok:false, canceled:true };
    patientDir = res.filePaths[0];
    return { ok:true, dir: patientDir };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-setDir', async (ev, dir)=>{
  try{
    if(!dir) return { ok:false, error:'no_dir' };
    if(!fsSync.existsSync(dir)) return { ok:false, error:'not_exists' };
    patientDir = dir;
    return { ok:true, dir: patientDir };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-list', async (ev)=>{
  try{
    if(!patientDir) return { ok:false, error:'no_dir' };
    const files = await fs.readdir(patientDir);
    const list = files.filter(f=> f.toLowerCase().endsWith('.json')).map(f=> ({ filename: f }));
    return { ok:true, list };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-load', async (ev, filename)=>{
  try{
    if(!patientDir) return { ok:false, error:'no_dir' };
    const p = path.join(patientDir, filename);
    const txt = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(txt);
    return { ok:true, parsed, filename };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-save', async (ev, opts)=>{
  try{
    const { name, data, overwriteFilename } = opts || {};
    if(!patientDir){
      // Ask user to pick a folder
      const res = await dialog.showOpenDialog({ properties:['openDirectory'] });
      if(res.canceled) return { ok:false, canceled:true };
      patientDir = res.filePaths[0];
    }
    let filename = overwriteFilename && String(overwriteFilename).trim() ? String(overwriteFilename).trim() : null;
    if(!filename){
      // Use the patient name as the filename (sanitized) — do not append timestamp so file name matches patient
      const base = sanitizeFilename(name || (data && data.name) || 'patient');
      filename = `${base}.json`;
    }
    const out = path.join(patientDir, filename);
    await fs.writeFile(out, JSON.stringify({ name, data }, null, 2), 'utf8');
    // Also update a companion CSV in the same folder (pv_one_patients.csv)
    try{
      const csvPath = path.join(patientDir, 'pv_one_patients.csv');
      const line = `"${filename}",${Date.now()},"${(name||'').replace(/"/g,'""')}"\n`;
      if(!fsSync.existsSync(csvPath)){
        await fs.writeFile(csvPath, 'filename,mtime,name\n'+line, 'utf8');
      } else {
        try{
          const txt = fsSync.readFileSync(csvPath, 'utf8');
          const lines = txt.split(/\r?\n/).filter(Boolean);
          const hdr = lines.length? lines[0] : 'filename,mtime,name';
          const rest = lines.slice(1).filter(l=> !l.startsWith('"'+filename+'"'));
          await fs.writeFile(csvPath, hdr+'\n'+line+rest.join('\n'), 'utf8');
        }catch(e){
          // fallback append
          await fs.appendFile(csvPath, line, 'utf8');
        }
      }
    }catch(e){ console.warn('Failed to update CSV:', e); }
    return { ok:true, filename, path: out };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-delete', async (ev, filename)=>{
  try{
    if(!patientDir) return { ok:false, error:'no_dir' };
    const p = path.join(patientDir, filename);
    await fs.unlink(p);
    return { ok:true };
  }catch(e){ return { ok:false, error: String(e) }; }
});

ipcMain.handle('patients-getDir', async ()=>{
  return { ok:true, dir: patientDir };
});
