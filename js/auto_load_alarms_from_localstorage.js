// Auto-load alarm rules from localStorage and refresh alarm evaluators/UI
// This runs on page load and whenever `pv-one-custom-alarms` is present in localStorage.
(function(){
  function safeParse(s){ try{return JSON.parse(s);}catch(e){return null;} }

  function loadAndApply(){
    try{
      const s = localStorage.getItem('pv-one-custom-alarms');
      if(!s) return; // nothing to do
      const parsed = safeParse(s);
      if(!parsed || !Array.isArray(parsed)) return;

      // Convert simple rule objects into the grouped format expected by the app
      const group = { subtitle: 'Custom rules (localStorage)', items: [] };
      parsed.forEach((r, idx) => {
        // allow various field names (expression, expr, rule)
        const expr = r.expression || r.expr || r.rule || r.expr || r.expression || '';
        const item = Object.assign({}, r);
        if(!item.expr && expr) item.expr = expr;
        if(!item.label && item.name) item.label = item.name;
        if(!item.id) item.id = item.id || item.tag || `local_${idx}`;
        group.items.push(item);
      });

      // Simpler approach: load group directly into window.ALARM_RULES (like the alarms bundle)
      // Prepend the local group so localStorage rules are active immediately.
      try{
        window.ALARM_RULES = window.ALARM_RULES || [];
        // Remove any previous local group to avoid duplicates
        window.ALARM_RULES = window.ALARM_RULES.filter(g=>g.subtitle!=='Custom rules (localStorage)');
        if(group.items && group.items.length){
          window.ALARM_RULES.unshift(group);
        }
      }catch(e){ console.warn('Failed to attach rules to window.ALARM_RULES', e); }

      // Initialize evaluators and refresh UI if available
      if(typeof initAlarmEvaluators === 'function'){
        try{ initAlarmEvaluators(); }catch(e){ console.warn('initAlarmEvaluators failed', e); }
      }
      if(typeof renderAlarmsReference === 'function'){
        try{ renderAlarmsReference(); }catch(e){ console.warn('renderAlarmsReference failed', e); }
      }
      if(typeof generateAll === 'function'){
        try{ generateAll(); }catch(e){ console.warn('generateAll failed', e); }
      }

  // console.log removed: Auto-loaded alarms from localStorage
    }catch(err){ console.error('Auto-load alarms error', err); }
  }

  // Run once on load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(loadAndApply, 10);
  } else {
    window.addEventListener('DOMContentLoaded', loadAndApply);
  }

  // Also watch localStorage changes from other windows (not always fired in same window)
  window.addEventListener('storage', function(e){
    if(e.key === 'pv-one-custom-alarms') loadAndApply();
  });

  // Expose a helper to reload on demand
  window.reloadAlarmsFromLocalStorage = loadAndApply;

})();
