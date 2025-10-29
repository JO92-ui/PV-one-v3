// scripts/perf.js
// Lightweight optional performance markers for debugging; safe no-ops if unused.
(function(){
  try{
    if (!('performance' in window)) return;
    window.PVPerf = window.PVPerf || {
      mark: (name)=> { try{ performance.mark(name); }catch(e){} },
      measure: (name, start, end)=> { try{ performance.measure(name, start, end); }catch(e){} }
    };
    // Initial mark so we can measure first render if desired
    window.PVPerf.mark('app-start');
  }catch(e){ /* no-op */ }
})();
