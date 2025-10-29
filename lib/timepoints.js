// lib/timepoints.js
// Lightweight module exposing timepoint helpers for gradual migration.
// Non-destructive: this module reads global state (TP_DEFAULTS, DEV_KEYS, DOSE_KEYS)
// and attaches helpers to window.timepoints so existing inline code is unaffected.

function _get(key){ return (window[key]); }

function _byId(id){ return document.getElementById(id); }

export function addTP(vals = null){
  // Use global TP_DEFAULTS if available
  const TP_DEFAULTS = _get('TP_DEFAULTS') || {};
  const DEV_KEYS = _get('DEV_KEYS') || [];
  const DOSE_KEYS = _get('DOSE_KEYS') || {};
  const defaults = Object.assign({}, TP_DEFAULTS, vals || {});
  const i = document.querySelectorAll('.tpCard').length;

  const d = (k)=> (defaults[k] ?? TP_DEFAULTS[k]);
  const card = document.createElement('div');
  card.className = 'tpCard mini';
  card.innerHTML = `
    <div class="tpHead" onclick="this.closest('.tpCard').classList.toggle('collapsed')">
      <label class="chip">✔ <input type="checkbox" id="t_on_${i}" ${d('on')?'checked':''}></label>
      <label class="chip">● <input type="radio" name="activeTP" id="t_active_${i}" ${d('active')?'checked':''}></label>
  <label class="chip">Time <input id="t_time_${i}" value="${d('time')}" style="width:90px"></label>
      <span class="small" id="lock_${i}" style="margin-left:auto;display:none">🔒 Hybrid EDV/ESV</span>
      <button class="btn" onclick="toggleTP(this)" style="margin-left:8px">👁️ Hide</button>
      <button class="btn" onclick="delTP(this)" style="margin-left:6px">🗑️</button>
    </div>

  <div class="gcol-3"><label>HR <input type="number" id="t_hr_${i}" value="${d('HR')}"></label></div>
  <div class="gcol-3"><label>CO (L/min) <input type="number" step="0.1" id="t_co_${i}" value="${d('CO')}"></label></div>
  <div class="gcol-3"><label>LVEF (%) <input type="number" id="t_lvef_${i}" value="${d('LVEF')}"></label></div>
  <div class="gcol-3"><label>Lactate <input type="number" step="0.1" id="t_lac_${i}" value="${d('Lactate')||d('Lact')}"></label></div>

  <div class="gcol-3"><label>SBP <input type="number" id="t_sbp_${i}" value="${d('SBP')}"></label></div>
  <div class="gcol-3"><label>DBP <input type="number" id="t_dbp_${i}" value="${d('DBP')}"></label></div>
  <div class="gcol-3"><label>sPAP <input type="number" id="t_spap_${i}" value="${d('sPAP')}"></label></div>
  <div class="gcol-3"><label>dPAP <input type="number" id="t_dpap_${i}" value="${d('dPAP')}"></label></div>

  <div class="gcol-3"><label>PCWP <input type="number" id="t_pwp_${i}" value="${d('PCWP')}"></label></div>
  <div class="gcol-3"><label>RAP <input type="number" id="t_rap_${i}" value="${d('RAP')}"></label></div>
  <div class="gcol-3"><label>ALT <input type="number" id="t_alt_${i}" value="${d('ALT')}"></label></div>
  <div class="gcol-3"><label>pH <input type="number" step="0.01" id="t_ph_${i}" value="${d('pH')}"></label></div>

  <div class="gcol-3"><label>EDV <input type="number" id="t_edv_${i}" value="${d('EDV')}"></label></div>
  <div class="gcol-3"><label>ESV <input type="number" id="t_esv_${i}" value="${d('ESV')}"></label></div>
  <div class="gcol-3"><label>OHCA <input type="checkbox" id="t_ohca_${i}" ${d('OHCA')?'checked':''}></label></div>

    <div class="gcol-12">
  <label class="chip">Prior therapy <input type="checkbox" id="t_prev_${i}" ${d('prior_therapy')?'checked':''}></label>
  <label class="chip">MCS for CS <input type="checkbox" id="t_mcs_cs_${i}" ${d('mcs_for_CS')?'checked':''}></label>
    </div>

    <div class="gcol-12"><label>Devices: ${DEV_KEYS.join(' · ')}</label></div>

    <div class="gcol-12">
      <div class="small" style="margin:6px 0">Doses (ON if &gt; 0):</div>
      <div class="row mono">
        ${Object.keys(DOSE_KEYS).map(k=>`<label>${k} (${DOSE_KEYS[k].unit}) <input type="number" step="0.01" id="t_dose_${k}_${i}" value="${d(k)}" style="width:90px"></label>`).join('')}
      </div>
    </div>

    <div class="gcol-3"><label>Creatinine (mg/dL) <input type="number" step="0.01" id="t_cr_${i}" value="${d('Cr')||''}" placeholder="optional"></label></div>
    <div class="gcol-3"><label>SvO2 (%) <input type="number" step="0.1" id="t_svo2_${i}" value="${d('SvO2')||d('svo2')||''}" placeholder="optional"></label></div>
  `;
  _byId('tpInputs').appendChild(card);
  // call global helpers if present
  if(window.applyReadOnly) try{ window.applyReadOnly(); }catch(e){}
  if(!document.querySelector('input[name="activeTP"]:checked')) {
    const el = _byId(`t_active_${i}`); if(el) el.checked = true;
  }
  // wire input event to global generateAll if exists
  try{ card.addEventListener('input', (window.debounce || ((fn,ms)=>fn))(window.generateAll || (()=>{}), 120)); }catch(e){}
  if(_byId('tpInputs').style.display === 'none'){
    _byId('tpInputs').style.display = '';
    const btn = _byId('btnToggleInputs'); if(btn) btn.textContent = '▼ Hide timepoints';
  }
}

export function delTP(btn){
  try{ btn.closest('.tpCard').remove(); if(window.applyReadOnly) window.applyReadOnly(); if(window.generateAll) window.generateAll(); }catch(e){ console.warn('delTP', e); }
}

export function toggleTP(btn){
  try{
    const card = btn.closest('.tpCard');
    const ch = card.querySelector('input[type="checkbox"][id^="t_on_"]');
    if(!ch) return;
    ch.checked = !ch.checked;
    btn.textContent = ch.checked ? '👁️ Hide' : '🙈 Hidden';
    card.classList.toggle('collapsed', !ch.checked);
    if(window.updatePVOnly) window.updatePVOnly();
  }catch(e){ console.warn('toggleTP', e); }
}

export function updatePVOnly(){ if(window.collectAll && window.renderPV){ try{ const all = window.collectAll(); window._lastSeries = all; window.renderPV(all); }catch(e){ console.warn('updatePVOnly', e); } }
}

export function applyReadOnly(){
  try{
    const isHybrid = _byId('method') && _byId('method').value === 'hybrid';
    document.querySelectorAll('.tpCard').forEach((row,idx)=>{
      const edv=_byId(`t_edv_${idx}`), esv=_byId(`t_esv_${idx}`), tag=_byId(`lock_${idx}`);
      if(!edv||!esv||!tag) return;
      edv.readOnly=isHybrid; esv.readOnly=isHybrid; tag.style.display=isHybrid?'inline':'none';
    });
  }catch(e){ console.warn('applyReadOnly', e); }
}

// Attach to window for backward compatibility and easy incremental migration
if(typeof window !== 'undefined'){
  window.timepoints = Object.assign(window.timepoints || {}, { addTP, delTP, toggleTP, updatePVOnly, applyReadOnly });
}

export default { addTP, delTP, toggleTP, updatePVOnly, applyReadOnly };
