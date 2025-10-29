// web-bridge.js - Reemplaza las funciones de Electron para funcionar en navegador web
// Este archivo simula window.pv que antes era expuesto por Electron/preload.js

(function() {
  'use strict';
  
  // Simulación de la API de pacientes usando localStorage
  const STORAGE_KEY_PREFIX = 'pv-one-patient-';
  const STORAGE_LIST_KEY = 'pv-one-patients-list';
  
  // Helper: obtener lista de pacientes guardados
  function getPatientsList() {
    try {
      const listStr = localStorage.getItem(STORAGE_LIST_KEY);
      return listStr ? JSON.parse(listStr) : [];
    } catch (e) {
      console.warn('Error reading patients list:', e);
      return [];
    }
  }
  
  // Helper: guardar lista de pacientes
  function savePatientsList(list) {
    try {
      localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving patients list:', e);
    }
  }
  
  // Helper: generar nombre de archivo único
  function sanitizeName(name) {
    return (name || 'patient').replace(/[^a-z0-9-_\. ]+/gi, '_').trim();
  }
  
  // Crear objeto window.pv compatible con la API de Electron
  window.pv = {
    // Funciones de base de datos (no usadas en esta versión, pero mantenemos compatibilidad)
    insertPoint: async (p) => {
      console.log('insertPoint not implemented in web version');
      return { ok: true };
    },
    
    getPoints: async () => {
      console.log('getPoints not implemented in web version');
      return { ok: true, points: [] };
    },
    
    savePNG: async (o) => {
      // Simular guardado de PNG (descargar como blob)
      try {
        const blob = new Blob([o.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = o.filename || 'export.png';
        a.click();
        URL.revokeObjectURL(url);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
    
    // API de pacientes usando localStorage
    patients: {
      save: async ({ name, data, overwriteFilename }) => {
        try {
          let filename;
          if (overwriteFilename) {
            filename = overwriteFilename;
          } else {
            // Use the patient name as the filename (sanitizado) per user request
            filename = `${sanitizeName(name)}.json`;
          }
          
          const storageKey = STORAGE_KEY_PREFIX + filename;
          const patientData = { name, data };
          
          // Guardar datos del paciente
          localStorage.setItem(storageKey, JSON.stringify(patientData));
          
          // Actualizar lista de pacientes
          let list = getPatientsList();
          const existing = list.find(p => p.filename === filename);
          if (!existing) {
            list.push({ filename, mtime: Date.now() });
            list.sort((a, b) => b.mtime - a.mtime);
            savePatientsList(list);
          } else {
            existing.mtime = Date.now();
            list.sort((a, b) => b.mtime - a.mtime);
            savePatientsList(list);
          }
          try{ window.pv && window.pv.patients && window.pv.patients._updateCSV && window.pv.patients._updateCSV(filename, patientData); }catch(e){}
          
          return { ok: true, filename };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },

      // Maintain a companion CSV in localStorage for clients that prefer CSV
      _updateCSV: function(filename, patientData){
        try{
          const CSV_KEY = 'pv-one-patients-csv';
          // helpers
          const b64EncodeUnicode = (str)=> btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1){ return String.fromCharCode('0x'+p1); }));
          const csvEscape = (s)=> '"'+String(s||'').replace(/"/g,'""')+'"';
          const existing = localStorage.getItem(CSV_KEY) || '';
          const header = 'filename,mtime,name';
          const mtime = Date.now();
          const patientName = (patientData && patientData.name) ? patientData.name : '';
          // Do not include full base64-encoded state in the CSV to keep it human-readable and smaller
          const row = [csvEscape(filename), mtime, csvEscape(patientName)].join(',');
          if(!existing){
            localStorage.setItem(CSV_KEY, header+'\n'+row);
          } else {
            // append (replace previous row for same filename)
            const lines = existing.split(/\r?\n/).filter(Boolean);
            const hdr = lines[0];
            const rest = lines.slice(1).filter(l=> !l.startsWith('"'+filename+'"')); // remove old
            rest.unshift(row);
            localStorage.setItem(CSV_KEY, hdr+'\n'+rest.join('\n'));
          }
        }catch(e){ console.warn('web-bridge CSV update failed', e); }
      },
      
      list: async () => {
        try {
          const list = getPatientsList();
          // Do not advertise a 'Folder' when using localStorage in the web bridge.
          // Returning an empty dir keeps the UI clean in Chrome/PC.
          return { ok: true, list, dir: '' };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
      
      load: async (filename) => {
        try {
          const storageKey = STORAGE_KEY_PREFIX + filename;
          const dataStr = localStorage.getItem(storageKey);
          if (!dataStr) {
            return { ok: false, error: 'Patient not found' };
          }
          const parsed = JSON.parse(dataStr);
          return { ok: true, parsed };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
      
      delete: async (filename) => {
        try {
          const storageKey = STORAGE_KEY_PREFIX + filename;
          localStorage.removeItem(storageKey);
          
          // Actualizar lista
          let list = getPatientsList();
          list = list.filter(p => p.filename !== filename);
          savePatientsList(list);

          // Also remove from CSV if present
          try{
            const CSV_KEY = 'pv-one-patients-csv';
            const existing = localStorage.getItem(CSV_KEY) || '';
            if(existing){
              const lines = existing.split(/\r?\n/).filter(Boolean);
              const hdr = lines[0];
              const rest = lines.slice(1).filter(l=> !l.startsWith('"'+filename+'"'));
              localStorage.setItem(CSV_KEY, hdr+'\n'+rest.join('\n'));
            }
          }catch(e){ console.warn('web-bridge CSV delete failed', e); }
          
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
      
      pickDir: async () => {
        // Check if File System Access API is available (Chrome/Edge/Safari 15.2+)
        if (window.showDirectoryPicker) {
          // Return a signal that we should use the browser's directory picker
          // The main code in index.html will handle this
          return { ok: false, canceled: false, useBrowserPicker: true };
        }
        
        // Check if we're on iOS/iPadOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOS) {
          alert('📁 Safari en iPad/iPhone tiene soporte limitado para carpetas.\n\n' +
                '✅ Tus pacientes se guardan en el navegador (localStorage).\n\n' +
                '💡 Para acceder a carpetas:\n' +
                '• Actualiza a Safari 15.2+ (iPadOS 15.2+)\n' +
                '• Usa los botones "💾 Save patient" y "📂 Load"\n' +
                '• Exporta/Importa CSV para respaldar');
        } else {
          // Other browsers (Firefox on desktop, etc.)
          alert('📁 Selector de carpetas no disponible en este navegador.\n\n' +
                '✅ Tus pacientes se guardan automáticamente en el navegador (localStorage).\n\n' +
                '💡 Alternativas:\n' +
                '• Usa Chrome/Edge para seleccionar carpetas\n' +
                '• Descarga versión Electron (PC)\n' +
                '• Usa botones Import/Export CSV para respaldar datos');
        }
        return { ok: false, canceled: true };
      },
      
      setDir: async (dir) => {
        // No aplicable en versión web
        return { ok: false, error: 'Not supported in web version' };
      }
    }
  };
  
  // Exponer alarmas engine si está disponible (placeholder)
  window.pvAlarms = {
    getActiveAlarms: (prev, curr) => {
      // Esta función ya está implementada en alarms.bundle.js
      // Solo mantenemos compatibilidad con la API
      if (window.getActiveAlarms && typeof window.getActiveAlarms === 'function') {
        return window.getActiveAlarms(prev, curr);
      }
      return [];
    }
  };
  
  console.log('✅ PV-One Web Bridge cargado - API de pacientes disponible en localStorage');
  
})();
