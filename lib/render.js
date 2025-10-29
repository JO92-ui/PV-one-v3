// lib/render.js
// Rendering helpers (Plotly wrappers, small formatting helpers)

export function fmt(x,d=1){ return Number.isFinite(x)? x.toFixed(d):'—'; }

export function stageColor(stage){
  return stage==='A' ? '#16a34a'
       : stage==='B' ? '#84cc16'
       : stage==='C' ? '#f59e0b'
       : stage==='D' ? '#ef4444'
       : '#991b1b';
}

// Lightweight, defensive Plotly wrapper helpers so rendering logic can be
// shared and moved into `lib/` without duplicating checks across the UI.

function _hasPlotly(){ return typeof window !== 'undefined' && window.Plotly && typeof window.Plotly.newPlot === 'function'; }

// ensurePlotly returns a Promise that resolves when Plotly is available.
function ensurePlotly(){
  if(_hasPlotly()) return Promise.resolve(window.Plotly);
  // prefer global loader if page injects one
  if(typeof window !== 'undefined' && window.loadPlotly && typeof window.loadPlotly === 'function'){
    return window.loadPlotly();
  }
  // try requiring the loader (Node/electron renderer compat)
  try{
    // eslint-disable-next-line global-require
    const loader = require('../scripts/loadPlotly');
    if(loader && typeof loader.loadPlotly === 'function') return loader.loadPlotly();
  }catch(e){}
  // as a fallback, return a rejected promise (caller should handle)
  return Promise.reject(new Error('Plotly not available'));
}

export function purgePlot(target){
  try{ if(_hasPlotly() && target){ const el = (typeof target === 'string')? document.getElementById(target) : target; if(el) window.Plotly.purge(el); } }catch(e){ /* ignore */ }
}

export function resizePlot(target){
  try{ if(_hasPlotly() && target){ const el = (typeof target === 'string')? document.getElementById(target) : target; if(el) window.Plotly.Plots.resize(el); } }catch(e){ /* ignore */ }
}

export function plotNew(target, data, layout={}, config={}){
  try{
    const el = (typeof target === 'string')? document.getElementById(target) : target;
    if(!el) return null;
    if(!_hasPlotly()){
      // try to load plotly dynamically; caller should await if needed
      ensurePlotly().then(()=>{
        try{ window.Plotly.newPlot(el, data, layout, Object.assign({displaylogo:false,responsive:true}, config)); }catch(e){ console.warn('plotNew post-load failed', e); }
      }).catch(()=>{/* ignore */});
      return null;
    }
    window.Plotly.newPlot(el, data, layout, Object.assign({displaylogo:false,responsive:true}, config));
    return el;
  }catch(err){ console.warn('plotNew failed', err); return null; }
}

// Gauge helper (small convenience wrapper used by the dashboard)
export const THEME = {
  bg: 'rgba(0,0,0,0)',
  fg: '#0b1b33',
  accent: '#5b82c7',
  positive: '#16a34a',
  negative: '#dc2626'
};

export function createGaugeSpec(title, value, range, steps, fmtStr){
  const val = Number.isFinite(value)? value : 0;
  const data = [{ type:'indicator', mode:'gauge+number', value: val,
    number:{ valueformat: fmtStr || '.1f', font:{ size:14 } }, title:{ text:title, font:{ size:12 } },
    gauge: { shape:'angular', domain:{ x:[0,1], y:[0.12,0.88] }, axis:{ range, tickfont:{size:10} }, steps: steps || [], bgcolor:'#fff', bar:{ color:'rgba(0,0,0,0)' }, threshold:{ value: val, line:{ color: THEME.fg, width:4 }, thickness:0.9 } } }];
  const layout = { margin:{t:6,b:6,l:6,r:6}, height: 160, paper_bgcolor: THEME.bg, font:{ size:12 } };
  const cfg = { displaylogo:false, responsive:true, displayModeBar:false };
  return { data, layout, config: cfg };
}

export function gaugeWithNeedle(target, title, value, range, steps, fmtStr){
  try{
    const el = (typeof target === 'string')? document.getElementById(target) : target;
    if(!el) return;
    purgePlot(el);
    const containerH = (el.clientHeight && el.clientHeight > 60) ? el.clientHeight : 160;
    const h = Math.max(120, Math.round(containerH * 0.70));
    const spec = createGaugeSpec(title, value, range, steps, fmtStr);
    // allow layout height to match container
    spec.layout = Object.assign({}, spec.layout, { height: h });
    plotNew(el, spec.data, spec.layout, spec.config);
  }catch(e){ console.warn('gaugeWithNeedle', e); }
}

// Build a small HTML legend for the PV panel given an active metrics object
export function buildPVLegend(active){
  try{
    if(!active) return '';
    const items = [
      {k:'Ees', v:active.Ees}, {k:'Ea', v:active.Ea}, {k:'ESP', v:active.ESP}, {k:'VAC', v:active.VAC},
      {k:'Veff', v:(active.EDV - active.V0_EDPVR).toFixed? (active.EDV - active.V0_EDPVR).toFixed(1) : '—'},
      {k:'PVA', v:active.PVA}, {k:'SW', v:active.SW}, {k:'PE', v:active.PE}, {k:'V0', v:active.V0_EDPVR},
      {k:'β', v:active.beta}, {k:'α', v:active.alpha}
    ];
    return items.map(it=>{
      let val = it.v;
      if(it.k === 'α'){ val = (Number.isFinite(it.v))? it.v.toExponential(2) : it.v; }
      else { val = Number.isFinite(it.v)? (typeof it.v==='number'? it.v.toFixed(2): it.v) : it.v; }
      // prefer PV-specific color attached by createPVSpec for clinic-mode consistency
      const pvCol = active._pvColor || active.color || '#1f6fff';
      const pvFill = active._pvFillColor || 'rgba(31,111,255,0.15)';
      const swatch = (it.k==='Ees' || it.k==='Ea')? pvCol : (it.k==='SW' ? pvFill : '#5b82c7');
      return `<div class="legendItem"><div class="swatch" style="background:${swatch};border-color:#365b9f"></div><div>${it.k}: <b>${val}</b></div></div>`;
    }).join('');
  }catch(e){ return ''; }
}

// Export other plotting helpers as the UI is refactored
