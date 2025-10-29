// lib/renderers.js
// Pure spec creators and renderer wrappers for Plotly-based views.
// createPVSpec(all) returns { data, layout, config, legendHtml }

(function(){
  // Small theme helper so plots adapt to dark mode and keep transparent backgrounds
  function _isDark(){
    try{ return (typeof document !== 'undefined') && document.body && document.body.classList && document.body.classList.contains('dark'); }catch(e){ return false; }
  }
  // Official CSWG‑SCAI palette (kept in JS and also exposed on window)
  const SCAI_COLORS = (function(){
    const map = { A:'#10b981', B:'#1f6fff', C:'#f59e0b', D:'#ef4444', E:'#6b7280' };
    try{ if(typeof window !== 'undefined'){ window.SCAI_COLORS = Object.assign({}, map); } }catch(e){}
    return map;
  })();

  function hexToRgba(hex, a){
    try{
      if(!hex) return `rgba(0,0,0,${a})`;
      let h = hex.replace('#',''); if(h.length===3) h = h.split('').map(c=>c+c).join('');
      const bigint = parseInt(h,16); const r = (bigint>>16)&255; const g = (bigint>>8)&255; const b = bigint&255;
      return `rgba(${r},${g},${b},${a})`;
    }catch(e){ return `rgba(0,0,0,${a})`; }
  }

  function _hasPlotly(){ try{ return typeof window !== 'undefined' && window.Plotly && typeof window.Plotly.newPlot === 'function'; }catch(e){ return false; } }

  function _plotTheme(){
    const dark = _isDark();
    if(!dark){
      return { paper:'transparent', plot:'transparent', font:'#0b1b33', axis:'#234', grid:'#e9eefb' };
    }
    return { paper:'transparent', plot:'transparent', font:'#e6edf3', axis:'#b6c2cf', grid:'rgba(230,237,243,0.12)' };
  }

  function ensurePlotly(){
    if(_hasPlotly()) return Promise.resolve(window.Plotly);
    if(typeof window !== 'undefined' && window.loadPlotly && typeof window.loadPlotly === 'function'){
      return window.loadPlotly();
    }
    try{
      const loader = require('../scripts/loadPlotly');
      if(loader && typeof loader.loadPlotly === 'function') return loader.loadPlotly();
    }catch(e){}
    return Promise.reject(new Error('Plotly not available'));
  }
  
  function createPVSpec(all, opts){
    // Build traces and layout similar to old inline renderPV
    opts = opts || {};
    const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
    const Nvis = vis.length;
    const clinicMode = (typeof opts.clinicMode === 'boolean') ? opts.clinicMode : ((typeof document !== 'undefined') && !!document.querySelector('.clinic-theme'));
  function timeHue(i){ return 200 - ( (i / Math.max(1, Nvis-1)) * 180 ); }
  // Prefer a shared professional palette if available; fall back to an internal palette.
  const DEFAULT_PV_COLORS = (typeof window !== 'undefined' && Array.isArray(window.DEFAULT_PV_COLORS)) ? window.DEFAULT_PV_COLORS : ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
  const defaultColorFor = (i) => { try{ if(typeof window !== 'undefined' && typeof window.hslColor === 'function') return window.hslColor(i); return DEFAULT_PV_COLORS[i % DEFAULT_PV_COLORS.length]; }catch(e){ return DEFAULT_PV_COLORS[i % DEFAULT_PV_COLORS.length]; } };
  const traces = [];
    vis.forEach((r, idx)=>{
  const h = timeHue(idx);
  // prefer explicit per-timepoint color when available; otherwise use the shared palette (via defaultColorFor)
  const timeColor = (r && r.color) ? r.color : defaultColorFor(idx);
  // compute a light fill color when user provided a color (hex/hsl), otherwise derive from defaultColorFor
  const fillColor = (r && r.color) ? (function(col){ try{ if(col.startsWith('hsl')) return col.replace('hsl','hsla').replace(')',',0.15)'); if(col.startsWith('#')){ const c = col.replace('#',''); const bigint = parseInt(c.length===3? c.split('').map(ch=>ch+ch).join('') : c,16); const rch = (bigint>>16)&255; const gch = (bigint>>8)&255; const bch = bigint&255; return `rgba(${rch},${gch},${bch},0.15)`; } return col; }catch(e){ return 'rgba(31,111,255,0.15)'; } })(r.color) : (function(col){ try{ const c = col || defaultColorFor(idx); if(c.startsWith('hsl')) return c.replace('hsl','hsla').replace(')',',0.15)'); if(c.startsWith('#')){ const cc = c.replace('#',''); const bigint = parseInt(cc.length===3? cc.split('').map(ch=>ch+ch).join('') : cc,16); const rch = (bigint>>16)&255; const gch = (bigint>>8)&255; const bch = bigint&255; return `rgba(${rch},${gch},${bch},0.15)`; } return c; }catch(e){ return `hsla(${Math.round(h)},70%,45%,0.15)`; } })(defaultColorFor(idx));
      // expose chosen PV color back onto the record so other UI helpers (legend, tooltips)
      // can use the exact color for swatches; don't overwrite if already provided
      try{ if(!r._pvColor) r._pvColor = timeColor; if(!r._pvFillColor) r._pvFillColor = fillColor; }catch(e){}
      const base = { x:r.V_loop, y:r.P_loop, mode:'lines', name:`${r.time}`, line:{color:timeColor,width:r.active?4:3}, showlegend:false };
      traces.push(Object.assign({}, base));
      if(r.active){
        traces.push({x:r.V, y:r.P_EDPVR, mode:'lines', name:`EDPVR ${r.time}`, line:{color:timeColor, dash:'dot', width:2}, showlegend:false});
        traces.push({x:r.V_espvr, y:r.P_espvr, mode:'lines', name:`Ees (ESPVR) ${r.time}`, line:{color:timeColor, dash:'dash', width:2}, showlegend:false});
        traces.push({x:r.V_ea, y:r.P_ea, mode:'lines', name:`Ea ${r.time}`, line:{color:timeColor, dash:'dot', width:2}, showlegend:false});
        traces.push({x:r.V_loop.concat([r.V_loop[0]]), y:r.P_loop.concat([0]), fill:'toself', mode:'lines', line:{color:timeColor,width:0}, fillcolor:fillColor, name:`SW area ${r.time}`, showlegend:false, hoverinfo:'skip', opacity:1});
      }
    });

    const active = all.find(r=>r.active && r.on) || all.find(r=>r.on) || all[0];
    const annotations = [];
    // In clinical / dashboard "clinicMode" we hide the PV helper labels (V₀ and VAC)
    if(active && !clinicMode){
      annotations.push({x:active.V0_EDPVR, y:0, text:`V₀ ${Number.isFinite(active.V0_EDPVR)? active.V0_EDPVR.toFixed(1):''} mL`, showarrow:true, ax:-20, ay:-30, bgcolor:'#fff', bordercolor:'#c9d7f8'});
      annotations.push({x:(active.EDV+active.ESV)/2, y:active.ESP*0.47, text:`VAC ${Number.isFinite(active.VAC)?active.VAC.toFixed(2):''} · Eff ${Number.isFinite(active.Eff)?active.Eff.toFixed(1):''}%`, showarrow:false, bgcolor:'#fff', bordercolor:'#c9d7f8'});
    }

    const THEME = _plotTheme();
    const layout = {
      paper_bgcolor: THEME.paper, plot_bgcolor: THEME.plot,
      xaxis:{title:'Volume (mL)',color:THEME.axis, gridcolor:THEME.grid},
      yaxis:{title:'Pressure (mmHg)',color:THEME.axis, gridcolor:THEME.grid, range:[0,150]},
      showlegend:false, annotations, margin:{t:30}, font:{ family:'Inter, Arial, sans-serif', size:14, color:THEME.font }
    };
    const config = {displaylogo:false,responsive:true,modeBarButtonsToRemove:['lasso2d','select2d']};

    // legend HTML: build rich summary with key PV metrics for the active TP
    let legendHtml = '';
    if(active){
      const pvCol = active._pvColor || (active.color || defaultColorFor(0));
      const pvFill = active._pvFillColor || (function(col){ try{ const c = col || defaultColorFor(0); if(c.startsWith('hsl')) return c.replace('hsl','hsla').replace(')',',0.15)'); if(c.startsWith('#')){ const cc = c.replace('#',''); const bigint = parseInt(cc.length===3? cc.split('').map(ch=>ch+ch).join('') : cc,16); const rch = (bigint>>16)&255; const gch = (bigint>>8)&255; const bch = bigint&255; return `rgba(${rch},${gch},${bch},0.15)`; } return c; }catch(e){ return 'rgba(31,111,255,0.15)'; } })(pvCol || defaultColorFor(0));
      const items = [
        {k:'Ees', v:active.Ees}, {k:'Ea', v:active.Ea}, {k:'ESP', v:active.ESP}, {k:'VAC', v:active.VAC},
        {k:'EDV', v:active.EDV}, {k:'ESV', v:active.ESV},
        {k:'Eff', v:active.Eff},
        {k:'PVA', v:active.PVA}, {k:'SW', v:active.SW}, {k:'PE', v:active.PE}, {k:'V0', v:active.V0_EDPVR},
        {k:'β', v:active.beta}, {k:'α', v:active.alpha}
      ];
      function fmtVal(k, v){
        if(k === 'α') return Number.isFinite(v)? v.toExponential(2) : '—';
        return Number.isFinite(v)? (typeof v==='number'? v.toFixed(2) : v) : '—';
      }
      function swatchFor(k){
        if(k==='Ees' || k==='Ea') return pvCol;
        if(k==='SW') return pvFill;
        return '#5b82c7';
      }
      legendHtml = '<div class="legendBox">' + items.map(function(it){
        return `<div class="legendItem"><div class="swatch" style="background:${swatchFor(it.k)};border-color:#365b9f"></div><div>${it.k}: <b>${fmtVal(it.k, it.v)}</b></div></div>`;
      }).join('') + '</div>';
    }

    return { data: traces, layout, config, legendHtml };
  }

  function renderPV(all, opts){
    try{
      const spec = createPVSpec(all);
      opts = opts || {};
      // resolve element: can pass DOM element or id
      let el = null;
      if(opts.element){ if(typeof opts.element === 'string') el = document.getElementById(opts.element); else el = opts.element; }
      if(!el) el = document.getElementById('plotPV'); if(!el) return null;
      const doPlot = function(){
        try{ window.Plotly.newPlot(el, spec.data, spec.layout, spec.config); }catch(e){ console.warn('renderPV plot failed', e); }
        try{ window.dispatchEvent(new CustomEvent('plot-rendered',{detail:{id: opts.plotId || el.id || 'plotPV', ts:Date.now()}})); }catch(e){}
        // legend
        try{ const legendEl = opts.legendElement ? (typeof opts.legendElement==='string'? document.getElementById(opts.legendElement) : opts.legendElement) : document.getElementById('pvLegend'); if(legendEl) legendEl.innerHTML = spec.legendHtml || ''; }catch(e){}
        return el;
      };

      if(!_hasPlotly()){
        // try to load plotly and plot after load
        ensurePlotly().then(function(){ try{ doPlot(); }catch(e){ console.warn('renderPV post-load failed', e); } }).catch((err)=>{ console.warn('ensurePlotly failed', err); });
        return null;
      }

      return doPlot();
    }catch(e){ console.warn('renderPV failed', e); return null; }
  }

  // Hemo (RAP vs PCWP) spec creator + renderer
  function _stageColor(stage){
    const k = (stage||'').toString().trim().toUpperCase();
    return SCAI_COLORS[k] || SCAI_COLORS.E;
  }

  function createHemoSpec(all, opts){
    opts = opts || {};
    const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
    if(!vis.length) return { data: [], layout: {}, config: {displaylogo:false,responsive:true}, legendHtml: '' };
    const text = vis.map(r=> `${r.time}h • SCAI ${r.SCAI} • ${r.SCAI_reason||''}`);
  const colors = vis.map(r=> _stageColor(r.SCAI));
  // expose hemo marker color on each timepoint for consistency with other UI helpers
  try{ vis.forEach((r, i)=> { if(!r._hemoColor) r._hemoColor = colors[i]; }); }catch(e){}
    const traces = [{
        x: vis.map(r=>r.RAP), y: vis.map(r=>r.PCWP), text, mode:'lines+markers', showlegend:false,
      marker:{size:12, color:colors, line:{width:2, color:'#1b2b49'}}
    }];

    const annotations = [];
    for(let i=1;i<vis.length;i++){
      const a = vis[i-1], b = vis[i];
      const dR = (b.RAP - a.RAP), dP = (b.PCWP - a.PCWP);
      const mag = Math.sqrt(dR*dR + dP*dP);
      const col = ((b.CI??0) - (a.CI??0)) >= 0 ? '#16a34a' : '#dc2626';
      annotations.push({ x: b.RAP, y: b.PCWP, ax: a.RAP, ay: a.PCWP, xref:'x', yref:'y', axref:'x', ayref:'y', text:'', showarrow:true, arrowhead:3, arrowsize:1, arrowwidth: Math.min(3,1+mag/5), arrowcolor: col });
    }

    const maxVal = Math.max(10, ...vis.map(r=> Math.max(Number(r.RAP)||0, Number(r.PCWP)||0)) ) * 1.15;
    // Quadrant thresholds
    const TH_RAP = 12;
    const TH_PCWP = 18;
    const max = Math.ceil(maxVal);
    const shapes = [
      {type:'rect', x0:0, x1:TH_RAP, y0:0, y1:TH_PCWP, fillcolor:'#eaf7f0', opacity:.8, line:{width:0}, layer:'below'},
      {type:'rect', x0:0, x1:TH_RAP, y0:TH_PCWP, y1:max, fillcolor:'#eaf2fe', opacity:.8, line:{width:0}, layer:'below'},
      {type:'rect', x0:TH_RAP, x1:max, y0:0, y1:TH_PCWP, fillcolor:'#fff8ea', opacity:.8, line:{width:0}, layer:'below'},
      {type:'rect', x0:TH_RAP, x1:max, y0:TH_PCWP, y1:max, fillcolor:'#ffebee', opacity:.8, line:{width:0}, layer:'below'},
      {type:'line', x0:TH_RAP, x1:TH_RAP, y0:0, y1:max, line:{width:2,dash:'dash',color:'#9fb6df'}, layer:'below'},
      {type:'line', x0:0, x1:max, y0:TH_PCWP, y1:TH_PCWP, line:{width:2,dash:'dash',color:'#9fb6df'}, layer:'below'}
    ];
    // In dark mode, remove quadrant fills entirely to avoid a white/washed look
    const darkH = _isDark();
    const shapesAdj = (darkH
      ? (function(){
          // Use vivid fills but control overall strength with shape opacity = 0.3
          const tints = [
            'rgb(16,185,129)', // greenish for Low RAP & Low PCWP
            'rgb(59,130,246)', // blue for Low RAP & High PCWP
            'rgb(245,158,11)', // amber for High RAP & Low PCWP
            'rgb(239,68,68)'   // red for High RAP & High PCWP
          ];
          let rectIdx = 0;
          return shapes.map(s=>{
            if(s.type === 'rect'){
              const fc = tints[rectIdx++] || 'rgb(255,255,255)';
              return Object.assign({}, s, { fillcolor: fc, opacity: 0.3, line: { width: 0 } });
            }
            return s;
          });
        })()
      : shapes);

    const THEME_H = _plotTheme();
    // Support a compact/small mode so clinic can render a quiet, space-saving figure
    const smallMode = !!opts.small;
    const baseFontSize = (typeof opts.fontSize === 'number') ? opts.fontSize : (smallMode ? 11 : 14);
    const axisTitleSize = Math.max(10, baseFontSize);
    const tickFontSize = Math.max(9, baseFontSize - 2);
    const layout = {
      paper_bgcolor: THEME_H.paper, plot_bgcolor: THEME_H.plot,
      xaxis:{title:{text:'RAP (mmHg)',font:{size:axisTitleSize}}, range:[0,max], color:THEME_H.axis, gridcolor:THEME_H.grid, tickfont:{size:tickFontSize}},
      yaxis:{title:{text:'PCWP (mmHg)',font:{size:axisTitleSize}}, range:[0,max], color:THEME_H.axis, gridcolor:THEME_H.grid, tickfont:{size:tickFontSize}},
      shapes: shapesAdj, showlegend:false, margin:{t:18,l:40,r:10,b:40}, annotations, font:{ family:'Inter, Arial, sans-serif', size:baseFontSize, color:THEME_H.font }
    };
    const config = { displaylogo:false, responsive:true };

    const legendHtml = (function(){
      const dark = _isDark();
      const wrapStart = `<div style="font-size:${Math.max(10, baseFontSize)}px;line-height:1.2">`;
      const wrapEnd = `</div>`;
      if(!dark){
        return wrapStart + `
          <div class="legendItem"><span class="swatch" style="background:#eaf7f0;border-color:#a7d7b9"></span>Low RAP (≤12) & Low PCWP (≤18)</div>
          <div class="legendItem"><span class="swatch" style="background:#eaf2fe;border-color:#bcd3ff"></span>Low RAP & High PCWP</div>
          <div class="legendItem"><span class="swatch" style="background:#fff8ea;border-color:#ffdf9e"></span>High RAP & Low PCWP</div>
          <div class="legendItem"><span class="swatch" style="background:#ffebee;border-color:#ffc3c8"></span>High RAP & High PCWP</div>
          <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.A}"></span>SCAI A</div>
          <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.B}"></span>SCAI B</div>
          <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.C}"></span>SCAI C</div>
          <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.D}"></span>SCAI D</div>
          <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.E}"></span>SCAI E</div>
        ` + wrapEnd;
      }
      // dark mode: use matching low-alpha tints for swatches (~30%)
      return wrapStart + `
        <div class="legendItem"><span class="swatch" style="background:rgba(16,185,129,0.4);border-color:rgba(16,185,129,0.6)"></span>Low RAP (≤12) & Low PCWP (≤18)</div>
        <div class="legendItem"><span class="swatch" style="background:rgba(59,130,246,0.4);border-color:rgba(59,130,246,0.6)"></span>Low RAP & High PCWP</div>
        <div class="legendItem"><span class="swatch" style="background:rgba(245,158,11,0.4);border-color:rgba(245,158,11,0.6)"></span>High RAP & Low PCWP</div>
        <div class="legendItem"><span class="swatch" style="background:rgba(239,68,68,0.4);border-color:rgba(239,68,68,0.6)"></span>High RAP & High PCWP</div>
  <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.A}"></span>SCAI A</div>
  <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.B}"></span>SCAI B</div>
  <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.C}"></span>SCAI C</div>
  <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.D}"></span>SCAI D</div>
  <div class="legendItem"><span class="swatch" style="background:${SCAI_COLORS.E}"></span>SCAI E</div>
      ` + wrapEnd;
    })();

    return { data: traces, layout, config, legendHtml };
  }

  function renderHemo(all, opts){
    opts = opts || {};
    try{
  // console.log removed: renderHemo called
      const spec = createHemoSpec(all, opts);
      // resolve element (accept id string or element)
      let el = null;
      if(opts.element){ if(typeof opts.element === 'string') el = document.getElementById(opts.element); else el = opts.element; }
      if(!el) el = document.getElementById('plotHemo'); if(!el) return null;
      const doPlot = function(){
        try{ window.Plotly.newPlot(el, spec.data, spec.layout, spec.config); }catch(e){ console.warn('renderHemo plot failed', e); }
        try{ window.dispatchEvent(new CustomEvent('plot-rendered',{detail:{id: opts.plotId || el.id || 'plotHemo', ts:Date.now()}})); }catch(e){}
        // legend
        try{ const legendEl = opts.legendElement ? (typeof opts.legendElement==='string'? document.getElementById(opts.legendElement) : opts.legendElement) : document.getElementById('hemoLegend'); if(legendEl) legendEl.innerHTML = spec.legendHtml || ''; }catch(e){}
        // Start / refresh hemo blink highlight for active timepoint (ensure prior timers/traces are cleared)
        try{
          if(typeof clearHemoBlinkTimers === 'function'){
            try{ clearHemoBlinkTimers(); }catch(e){}
          }
          // Map the global active index (which references the full `all` array)
          // into the visible `vis` array used to build the hemo spec. This avoids
          // indexing mismatches when selecting marker colors or starting blink
          // overlays. Only start a blink if the active timepoint is actually
          // visible (on=true) and has finite coordinates.
          try{
            const activeIdx = (typeof getActiveTPIndex === 'function') ? getActiveTPIndex() : -1;
            if(activeIdx >= 0 && Array.isArray(all) && activeIdx < all.length){
              const activePoint = all[activeIdx];
              const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
              // prefer object identity; fall back to matching by time label if needed
              let visIndex = -1;
              try{ visIndex = vis.findIndex(v => v === activePoint); }catch(e){}
              if(visIndex < 0 && activePoint && activePoint.time !== undefined){
                try{ visIndex = vis.findIndex(v => String(v.time) === String(activePoint.time)); }catch(e){}
              }
              // compute coordinates and only proceed if the active TP is visible
              const hx = (activePoint && activePoint.RAP !== undefined && activePoint.RAP !== null) ? Number(activePoint.RAP) : NaN;
              const hy = (activePoint && activePoint.PCWP !== undefined && activePoint.PCWP !== null) ? Number(activePoint.PCWP) : NaN;
              if(visIndex >= 0 && Number.isFinite(hx) && Number.isFinite(hy)){
                // prefer per-record precomputed color when present; otherwise index into the spec's marker.color using visIndex
                let hcol = (activePoint && activePoint._hemoColor) ? activePoint._hemoColor : null;
                try{
                  if(!hcol && spec && spec.data && spec.data[0] && spec.data[0].marker && Array.isArray(spec.data[0].marker.color)){
                    hcol = spec.data[0].marker.color[visIndex] || hcol;
                  }
                }catch(e){}
                if(!hcol) hcol = '#1f77b4';
                try{ 
                  // Do not start blink overlays on the Dashboard main plot (#plotHemo).
                  // Keep clinic mirror behaviour intact (plotHemoClinic may still blink).
                  if(typeof startBlinkForHemo === 'function'){
                    try{
                      const mainElId = (el && el.id) ? String(el.id) : null;
                      if(mainElId !== 'plotHemo'){
                        startBlinkForHemo(el, hx, hy, hcol, 'hemo_main');
                      }
                    }catch(e){}
                  }
                }catch(e){}
                try{ const blinkSettings = window.BLINK_SETTINGS || {}; if(blinkSettings.clinicMirror){ const clinicEl = document.getElementById('plotHemoClinic'); if(clinicEl && typeof startBlinkForHemo === 'function') startBlinkForHemo(clinicEl, hx, hy, hcol, 'hemo_clinic'); } }catch(e){}
              }
            }
          }catch(e){ console.warn('lib.renderers hemo blink init failed', e); }
        }catch(e){ console.warn('lib.renderers hemo blink init failed', e); }
        return el;
      };

      if(!_hasPlotly()){
        ensurePlotly().then(function(){ try{ doPlot(); }catch(e){ console.warn('renderHemo post-load failed', e); } }).catch((err)=>{ console.warn('ensurePlotly failed', err); });
        return null;
      }

      return doPlot();
    }catch(e){ console.warn('renderHemo failed', e); return null; }
  }

  // Trends (time series) spec creator + renderer
  function createTrendsSpec(all, opts){
    opts = opts || {};
  const selVars = Array.isArray(opts.selVars) && opts.selVars.length ? opts.selVars : (['MAP','PCWP','CI','Lactate','LVIS']);
    const normalize = !!opts.normalize;
    const deltas = !!opts.deltas;
    const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
    if(!vis.length) return { data: [], layout: {}, config: {displaylogo:false,responsive:true}, legendHtml: '' };
    const xn = vis.map((r, idx) => { const v = parseFloat(r.time); return Number.isFinite(v)? v : idx; });
  const ref = { MAP:100, PCWP:18, CI:2.2, Lactate:2, LVIS:10 };
    const getY = (arr,key)=> normalize ? arr.map(r=> (Number.isFinite(r[key])? (r[key]/(ref[key]||1)) : null)) : arr.map(r=> (Number.isFinite(r[key])? r[key] : null));
    const base = vis[0] || {};
    const colors = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    const traces = [];
    selVars.forEach((k, idx)=>{
      traces.push({ x: xn, y: getY(vis,k), name: k, mode: 'lines+markers', showlegend: true, line: { color: colors[idx % colors.length] } });
    });
    if(deltas){
      selVars.forEach((k, idx)=>{
        const d = vis.map(r=> (Number.isFinite(r[k]) && Number.isFinite(base[k]))? (r[k] - base[k]) : null);
        traces.push({ x: xn, y: d, name: `Δ${k}`, mode: 'lines+markers', line: { dash: 'dot', color: colors[idx % colors.length] }, yaxis: 'y2', showlegend: true });
      });
    }
    const THEME_T = _plotTheme();
    const layout = {
      paper_bgcolor: THEME_T.paper, plot_bgcolor: THEME_T.plot,
      xaxis:{title:'Time (h)', zeroline:false,color:THEME_T.axis,gridcolor:THEME_T.grid},
      yaxis:{title: normalize? 'Normalized (0–~1)' : 'Value', color:THEME_T.axis, gridcolor:THEME_T.grid},
      yaxis2:{title:'Delta', overlaying:'y', side:'right', color:THEME_T.axis},
      margin:{t:20}, font:{ family:'Inter, Arial, sans-serif', size:14, color:THEME_T.font }
    };
    const config = { displaylogo:false, responsive:true };
    return { data: traces, layout, config, legendHtml: '' };
  }

  function renderTrends(all){
    try{
  // console.log removed: renderTrends called
      // Read UI selections when available; otherwise default
      const selVars = (function(){ try{ const arr = []; for(let i=0;i<5;i++){ const s = document.getElementById(`selTrVar_${i}`); if(s && s.value) arr.push(s.value); } return arr.length? arr : null; }catch(e){ return null; } })();
      const normalize = (function(){ try{ return !!document.getElementById('chkNormalize')?.checked; }catch(e){ return false; } })();
      const deltas = (function(){ try{ return !!document.getElementById('chkTrDeltas')?.checked; }catch(e){ return false; } })();
      const spec = createTrendsSpec(all, { selVars: selVars || undefined, normalize, deltas });
      const el = document.getElementById('plotTr'); if(!el) return null;
      if(!_hasPlotly()){
  // console.log removed: Plotly not present for Trends
  ensurePlotly().then(()=>{ try{ /* renderTrends post-load */ window.Plotly.newPlot(el, spec.data, spec.layout, spec.config); }catch(e){ console.warn('renderTrends post-load failed', e); } }).catch((err)=>{ console.warn('ensurePlotly failed', err); });
        return null;
      }
        window.Plotly.newPlot(el, spec.data, spec.layout, spec.config);
        try{ window.dispatchEvent(new CustomEvent('plot-rendered',{detail:{id:'plotTr', ts:Date.now()}})); }catch(e){}
      return el;
    }catch(e){ console.warn('renderTrends failed', e); return null; }
  }

  // attach
  if(typeof window !== 'undefined'){
    window.renderers = window.renderers || {};
    window.renderers.createPVSpec = createPVSpec;
    window.renderers.renderPV = renderPV;
    window.renderers.createHemoSpec = createHemoSpec;
    window.renderers.renderHemo = renderHemo;
    // Clinic prognosis renderer: populates #clinicPrognosis with probabilities per timepoint
    function renderClinicPrognosis(all){
      // Hoist commonly-used helpers so they are available to the whole function scope
      const allArr = Array.isArray(all) ? all : [];
      // Precompute first ISO timestamp (ms) once for efficiency.
      const _firstISOTs = (function(){
        try{
          for(let i=0;i<allArr.length;i++){ const x = allArr[i]; if(x && x.time && !isNaN(Date.parse(x.time))){ return Date.parse(x.time); } }
        }catch(e){}
        return null;
      })();

      function parseHoursFor(tp){
        try{
          if(!tp || tp.time === undefined || tp.time === null) return 0;
          let t = String(tp.time).trim();
          if(!t) return 0;
          // common label for baseline
          if(/^\s*base(?:line)?\s*$/i.test(t)) return 0;
          // direct numeric value or leading numeric (handles "12", "12 h", "12h", "12hrs")
          const m = t.match(/(-?\d+(?:\.\d+)?)/);
          if(m && m[0] !== undefined){ const n = parseFloat(m[0]); if(Number.isFinite(n)) return n; }
          // colon time like HH:MM or H:MM -> convert to hours
          const colon = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          if(colon){ const hh = parseInt(colon[1],10); const mm = parseInt(colon[2],10); if(Number.isFinite(hh) && Number.isFinite(mm)) return hh + (mm/60); }
          // try ISO date parse; if we have a first ISO timestamp, compute hours relative to it
          const parsed = Date.parse(t);
          if(!isNaN(parsed)){
            if(_firstISOTs !== null){ const ms = parsed - _firstISOTs; if(Number.isFinite(ms)) return ms / 3600000; }
            // if no reference, fall back to absolute hours since epoch (not ideal) but better than 0
            return parsed / 3600000;
          }
        }catch(e){}
        return 0;
      }

      try{
        const el = document.getElementById('clinicPrognosis');
        if(!el){ console.warn('renderClinicPrognosis: element #clinicPrognosis not found'); return null; }
        // debug info: quickly show what was passed in (length and sample SCAI/time)
        try{ const arr = Array.isArray(all)? all : []; console.debug('renderClinicPrognosis called', { allLength: arr.length, sample: arr.slice(0,5).map(a=>({time:a.time, on:!!a.on, active:!!a.active, SCAI: a.SCAI})) }); }catch(e){}
    el.innerHTML = '';
  // Use all timepoints by default (ensures probabilities are visible even when 'on' flags vary).
  // Order so active timepoint is first for visibility.
  let vis = allArr.slice();
  if(vis.length){ vis.sort((a,b)=> (b.active?1:0) - (a.active?1:0)); }
  if(!vis.length){ const ph = document.createElement('div'); ph.className='small'; ph.id='clinicPrognosisPlaceholder'; ph.textContent = 'No prognosis data available. Update timepoints to compute probabilities.'; el.appendChild(ph); return el; }
        // No fallbacks: use only explicit prediction fields if present. If missing, show '—'.
  const table = document.createElement('table'); table.className = 'clinic-prognosis-table'; table.style.width='100%'; table.style.borderCollapse='collapse';
  // If some timepoints were originally off, show a small explanatory line above the table
  try{ const anyOff = allArr.some(r=> r.on === false); if(anyOff){ const note = document.createElement('div'); note.className='small'; note.style.marginBottom='8px'; note.style.color='#4b5563'; note.textContent = 'Note: showing all timepoints (including ones not selected for display) so prognosis is visible.'; el.appendChild(note); } }catch(e){}

  // Determine CS type selection in the UI: 'ami', 'hf', or null (none). If none => General -> show both columns
  let csSelected = null;
  try{ csSelected = (document.querySelector('#csTypeGroup input:checked')?.value || null); if(csSelected) csSelected = csSelected.toString().toLowerCase(); }catch(e){ csSelected = null; }
  // Show general in-hospital mortality only when no etiology is selected (General view).
  const showGeneral = csSelected === null;
  const showMI = csSelected === 'ami' || csSelected === null; // show MI if AMI selected or General (null)
  const showHF = csSelected === 'hf' || csSelected === null; // show HF if HF selected or General (null)

  const thead = document.createElement('thead'); const hrow = document.createElement('tr');
  // Build header dynamically based on selected CS type
  const headers = ['Time','SCAI'];
  if(showGeneral) headers.push('In-hospital CS mortality');
  if(showMI) headers.push('AMI‑CS mortality');
  if(showHF) headers.push('HF‑CS mortality');
  headers.push('Escalation probability');
  headers.forEach(t=>{
    const th = document.createElement('th'); th.textContent = t;
    th.style.textAlign = 'left'; th.style.padding = '6px 8px'; th.style.fontWeight = '600'; th.style.fontSize = '13px';
    hrow.appendChild(th);
  }); thead.appendChild(hrow); table.appendChild(thead);
  const tbody = document.createElement('tbody');

  // helper to render a percentage bar cell
  function makeBarCell(val, decimals){
    const td = document.createElement('td'); td.className = 'clinic-prog-cell'; td.style.padding='6px 8px'; td.style.verticalAlign='middle';
    if(!Number.isFinite(val)){
      td.textContent = '—'; return td;
    }
    const pct = Math.max(0, Math.min(100, (val*100)));
    const wrapper = document.createElement('div'); wrapper.className='clinic-prog-bar-wrapper'; wrapper.style.display='flex'; wrapper.style.alignItems='center'; wrapper.style.gap='8px';
    const bar = document.createElement('div'); bar.className='clinic-prog-bar'; bar.style.flex='1';
    const fill = document.createElement('div'); fill.className='clinic-prog-bar-fill'; fill.style.width = pct + '%'; fill.style.background = pct > 50 ? '#ef4444' : (pct > 20 ? '#f59e0b' : '#10b981');
    bar.appendChild(fill);
    const label = document.createElement('div'); label.className='clinic-prog-bar-label'; label.style.minWidth='56px'; label.style.textAlign='right'; label.style.fontVariantNumeric='tabular-nums'; label.style.fontWeight='600';
    label.textContent = (decimals? pct.toFixed(decimals) : Math.round(pct)) + '%';
    wrapper.appendChild(bar); wrapper.appendChild(label); td.appendChild(wrapper); return td;
  }

  vis.forEach((r)=>{
    const tr = document.createElement('tr');
    const time = document.createElement('td'); time.textContent = r.time || '—'; time.style.padding='6px 8px'; tr.appendChild(time);
    const scai = document.createElement('td'); scai.textContent = r.SCAI || '—'; scai.style.padding='6px 8px'; scai.style.fontWeight='700'; tr.appendChild(scai);
    // Use only explicit prediction fields (multiple possible field names supported). If none, values remain null.
    const mortVal = Number.isFinite(r.pred_mortality) ? r.pred_mortality : (Number.isFinite(r.predicted_mortality) ? r.predicted_mortality : (Number.isFinite(r.pred_inhospital_mortality) ? r.pred_inhospital_mortality : (Number.isFinite(r.predicted_in_hospital_mortality) ? r.predicted_in_hospital_mortality : null)));
    const mortMIVal = Number.isFinite(r.pred_mortality_mi_cs) ? r.pred_mortality_mi_cs : (Number.isFinite(r.predicted_mortality_mi_cs) ? r.predicted_mortality_mi_cs : (Number.isFinite(r.pred_inhospital_mi_cs) ? r.pred_inhospital_mi_cs : null));
    const mortHFVal = Number.isFinite(r.pred_mortality_hf_cs) ? r.pred_mortality_hf_cs : (Number.isFinite(r.predicted_mortality_hf_cs) ? r.predicted_mortality_hf_cs : (Number.isFinite(r.pred_inhospital_hf_cs) ? r.pred_inhospital_hf_cs : null));
    const escVal = Number.isFinite(r.pred_escalation_prob) ? r.pred_escalation_prob : (Number.isFinite(r.predicted_escalation_prob) ? r.predicted_escalation_prob : (Number.isFinite(r.pred_prob_escalation) ? r.pred_prob_escalation : null));

    // Display-only fallbacks: keep the codebase clean by not injecting fallback values into data,
    // but show reasonable defaults in the UI when explicit predictions are absent.
    // Per-SCAI mortality timeline (General in-hospital CS mortality) taken from Supplemental Table 2
    // Keys are hours: 0 (baseline), 6, 12, 18, 24, 48, 72
    const mortalityTimeline = {
      'A': { 0:0.201, 6:0.097, 12:0.104, 18:0.099, 24:0.098, 48:0.084, 72:0.088 },
      'B': { 0:0.240, 6:0.150, 12:0.181, 18:0.153, 24:0.173, 48:0.156, 72:0.170 },
      'C': { 0:0.190, 6:0.191, 12:0.192, 18:0.198, 24:0.194, 48:0.190, 72:0.181 },
      'D': { 0:0.311, 6:0.298, 12:0.302, 18:0.312, 24:0.305, 48:0.290, 72:0.301 },
      'E': { 0:0.538, 6:0.569, 12:0.545, 18:0.534, 24:0.527, 48:0.555, 72:0.520 }
    };
    // Per-SCAI mortality timelines for AMI-CS (A) and HF-CS (B) from Supplemental Table (counts and % provided by user)
    const mortalityTimelineMI = {
      'A': { 0:0.240, 6:0.114, 12:0.111, 18:0.154, 24:0.137, 48:0.102, 72:0.104 },
      'B': { 0:0.281, 6:0.154, 12:0.216, 18:0.081, 24:0.200, 48:0.130, 72:0.074 },
      'C': { 0:0.188, 6:0.213, 12:0.223, 18:0.238, 24:0.229, 48:0.233, 72:0.235 },
      'D': { 0:0.385, 6:0.387, 12:0.387, 18:0.385, 24:0.384, 48:0.376, 72:0.390 },
      'E': { 0:0.569, 6:0.602, 12:0.578, 18:0.604, 24:0.600, 48:0.676, 72:0.638 }
    };
    const mortalityTimelineHF = {
      'A': { 0:0.154, 6:0.081, 12:0.089, 18:0.088, 24:0.087, 48:0.077, 72:0.065 },
      'B': { 0:0.181, 6:0.114, 12:0.165, 18:0.134, 24:0.127, 48:0.118, 72:0.182 },
      'C': { 0:0.168, 6:0.151, 12:0.152, 18:0.157, 24:0.155, 48:0.150, 72:0.134 },
      'D': { 0:0.239, 6:0.232, 12:0.238, 18:0.240, 24:0.230, 48:0.218, 72:0.232 },
      'E': { 0:0.492, 6:0.500, 12:0.467, 18:0.493, 24:0.486, 48:0.509, 72:0.458 }
    };
    // Keep etiology-specific fallbacks for MI/HF (previously updated)
    const fallbackBySCAI = {
      'A': { mortality: null, mi: 0.2400, hf: 0.1540, escalation: null },
      'B': { mortality: 0.24,   mi: 0.2810, hf: 0.1810, escalation: 0.90 },
      'C': { mortality: 0.1953, mi: 0.1880, hf: 0.1680, escalation: 0.68 },
      'D': { mortality: 0.3645, mi: 0.3850, hf: 0.2390, escalation: 0.18 },
      'E': { mortality: 0.529,  mi: 0.5690, hf: 0.4920, escalation: null }
    };

    const scaiKey = (r.SCAI || '').toString().trim().toUpperCase();
    const fb = fallbackBySCAI[scaiKey] || {};
    // Determine general mortality by picking the nearest time bin from mortalityTimeline
    let displayMort = null;
    if(Number.isFinite(mortVal)){
      displayMort = mortVal;
    } else {
      try{
        const hours = parseHoursFor(r);
        const bins = [0,6,12,18,24,48,72];
        // find nearest bin
        let nearest = bins[0]; let bestDiff = Math.abs(hours - bins[0]);
        for(let i=1;i<bins.length;i++){ const d = Math.abs(hours - bins[i]); if(d < bestDiff){ bestDiff = d; nearest = bins[i]; } }
        const rowTimeline = mortalityTimeline[scaiKey];
        if(rowTimeline && rowTimeline[nearest] !== undefined) displayMort = rowTimeline[nearest];
        else displayMort = fb.mortality ?? null;
      }catch(e){ displayMort = fb.mortality ?? null; }
    }
    // Determine AMI/HF mortalities by nearest time bin if explicit per-timepoint predictions are absent
    let displayMortMI = null;
    if(Number.isFinite(mortMIVal)){
      displayMortMI = mortMIVal;
    } else {
      try{
        const hours = parseHoursFor(r);
        const bins = [0,6,12,18,24,48,72];
        let nearest = bins[0]; let bestDiff = Math.abs(hours - bins[0]);
        for(let i=1;i<bins.length;i++){ const d = Math.abs(hours - bins[i]); if(d < bestDiff){ bestDiff = d; nearest = bins[i]; } }
        const rowMI = mortalityTimelineMI[scaiKey];
        if(rowMI && rowMI[nearest] !== undefined) displayMortMI = rowMI[nearest];
        else displayMortMI = fb.mi ?? null;
      }catch(e){ displayMortMI = fb.mi ?? null; }
    }

    let displayMortHF = null;
    if(Number.isFinite(mortHFVal)){
      displayMortHF = mortHFVal;
    } else {
      try{
        const hours = parseHoursFor(r);
        const bins = [0,6,12,18,24,48,72];
        let nearest = bins[0]; let bestDiff = Math.abs(hours - bins[0]);
        for(let i=1;i<bins.length;i++){ const d = Math.abs(hours - bins[i]); if(d < bestDiff){ bestDiff = d; nearest = bins[i]; } }
        const rowHF = mortalityTimelineHF[scaiKey];
        if(rowHF && rowHF[nearest] !== undefined) displayMortHF = rowHF[nearest];
        else displayMortHF = fb.hf ?? null;
      }catch(e){ displayMortHF = fb.hf ?? null; }
    }
    const displayEsc = Number.isFinite(escVal) ? escVal : (fb.escalation ?? null);

  // append mortality and etiology-specific columns according to selection
  if(showGeneral) tr.appendChild(makeBarCell(displayMort, 2));
  if(showMI) tr.appendChild(makeBarCell(displayMortMI, 2));
  if(showHF) tr.appendChild(makeBarCell(displayMortHF, 2));
  tr.appendChild(makeBarCell(displayEsc, 0));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  el.appendChild(table);
  // SCAI walker: visual stepper below the prognosis table showing SCAI stages in chronological order
  try{
    // Title above the walker for clarity
    const walkerTitle = document.createElement('div');
    walkerTitle.textContent = 'CSWG-SCAI walker';
    walkerTitle.className = 'small';
    walkerTitle.style.fontWeight = '700';
    walkerTitle.style.marginTop = '10px';
    walkerTitle.style.marginBottom = '4px';

    const walkerWrap = document.createElement('div');
    walkerWrap.style.display = 'flex';
    walkerWrap.style.alignItems = 'center';
    walkerWrap.style.gap = '8px';
    walkerWrap.style.marginTop = '4px';
    walkerWrap.style.flexWrap = 'wrap';
    walkerWrap.style.justifyContent = 'flex-start';
    walkerWrap.style.overflowX = 'visible';
    // build sequence using chronological order (fallback to given order)
    const seq = Array.isArray(allArr) ? allArr.slice() : [];
    seq.sort((a,b)=>{
      const ah = parseHoursFor(a), bh = parseHoursFor(b);
      if(Number.isFinite(ah) && Number.isFinite(bh)) return ah - bh;
      return 0;
    });
  const colorMap = Object.assign({}, SCAI_COLORS);
    // Ensure pulse animation styles exist once
    try{
      if(!document.getElementById('scaiPulseStyles')){
        const st = document.createElement('style'); st.id = 'scaiPulseStyles';
        st.textContent = `@keyframes scaiPulse{0%{box-shadow:0 0 0 0 var(--pulse-color, rgba(0,0,0,0));}50%{box-shadow:0 0 0 8px var(--pulse-color, rgba(0,0,0,0.25));}100%{box-shadow:0 0 0 0 var(--pulse-color, rgba(0,0,0,0));}}`;
        document.head.appendChild(st);
      }
    }catch(e){}
    seq.forEach((r, idx)=>{
      const letter = (r.SCAI || '—').toString().toUpperCase();
      const node = document.createElement('div');
      node.className = 'scai-node';
      node.style.display = 'flex';
      node.style.flexDirection = 'column';
      node.style.alignItems = 'center';
      node.style.justifyContent = 'center';
      node.style.minWidth = '64px';
      node.style.padding = '6px';
      node.style.borderRadius = '8px';
      node.style.border = '1px solid rgba(0,0,0,0.06)';
      node.style.background = 'transparent';
      node.style.color = '#111827';
      node.style.fontWeight = '700';
      node.dataset.tpTime = r.time;

      const activeColor = colorMap[letter] || '#1f6fff';
      const swatchColor = activeColor; // keep official color even when not selected

      node.innerHTML = `
        <div class="scai-swatch" style="width:36px;height:36px;border-radius:50%;background:${swatchColor};display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.95);font-weight:800;font-size:14px;margin-bottom:6px;border:2px solid rgba(255,255,255,0.9);">
          ${letter}
        </div>
        <div class="small" style="font-size:11px;opacity:0.95;text-align:center;">${r.time || '—'}</div>
      `;

      if(r.active){
        node.style.transform = 'scale(1.05)';
        const sw = node.querySelector('.scai-swatch');
        if(sw){
          try{ sw.style.setProperty('--pulse-color', hexToRgba(activeColor, 0.28)); }catch(e){}
          sw.style.animation = 'scaiPulse 1.6s ease-in-out infinite';
          sw.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)';
        }
      }

      // Make walker node interactive: clicking it sets the active timepoint and triggers a UI refresh
      try{
        node.style.cursor = 'pointer';
        // find original index in allArr so we can target the correct radio
        const origIdx = (Array.isArray(allArr) ? allArr.indexOf(r) : -1);
        if(origIdx >= 0){ node.dataset.tpIndex = String(origIdx); }
        node.addEventListener('click', function(){
          try{
            // clear previous selection and emit change events
            const allRadios = Array.from(document.querySelectorAll('input[name="activeTP"]'));
            allRadios.forEach(r => { if(r.checked){ r.checked = false; try{ r.dispatchEvent(new Event('change', {bubbles: true})); }catch(e){} } });

            // set the requested radio and emit change
            if(origIdx >= 0){
              const rd = document.getElementById(`t_active_${origIdx}`);
              if(rd){ rd.checked = true; try{ rd.dispatchEvent(new Event('change', {bubbles: true})); }catch(e){} }
            }

            // Ensure the timepoint is enabled (on) and emit change
            try{
              const onChk = document.getElementById(`t_on_${origIdx}`);
              if(onChk && !onChk.checked){ onChk.checked = true; try{ onChk.dispatchEvent(new Event('change', {bubbles: true})); }catch(e){} }
            }catch(e){}

            // Trigger global refresh if available
            if(typeof window.generateAll === 'function'){
              window.generateAll();
            } else if(typeof window.renderHemo === 'function' && typeof window.collectAll === 'function'){
              try{ window.renderHemo(window.collectAll()); }catch(e){}
            }
          }catch(e){ console.warn('walker node click handler failed', e); }
        });
      }catch(e){}
      walkerWrap.appendChild(node);
      if(idx < seq.length - 1){ const arrow = document.createElement('div'); arrow.innerHTML = '&#8594;'; arrow.style.margin = '0 6px'; arrow.style.fontSize = '18px'; arrow.style.opacity = '0.65'; walkerWrap.appendChild(arrow); }
    });
    el.appendChild(walkerTitle);
    el.appendChild(walkerWrap);
  }catch(err){ console.warn('SCAI walker build failed', err); }
        return el;
      }catch(e){ console.warn('renderClinicPrognosis failed', e); return null; }
    }
    window.renderers.renderClinicPrognosis = renderClinicPrognosis;
  }
  if(typeof module !== 'undefined' && module.exports){ module.exports = { createPVSpec, renderPV, createHemoSpec, renderHemo, renderClinicPrognosis }; }
})();
