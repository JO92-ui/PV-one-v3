// Simple smoke test for active->vis mapping logic used by hemo blink init
// This test does NOT require Plotly or DOM. It verifies the mapping behavior only.

function mapActiveToVisIndex(all, activeIdx){
  const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
  if(!(activeIdx >= 0 && Array.isArray(all) && activeIdx < all.length)) return { visIndex: -1 };
  const activePointAll = all[activeIdx];
  let visIndex = -1;
  try{ visIndex = vis.findIndex(v => v === activePointAll); }catch(e){}
  if(visIndex < 0 && activePointAll && activePointAll.time !== undefined){
    try{ visIndex = vis.findIndex(v => String(v.time) === String(activePointAll.time)); }catch(e){}
  }
  return { visIndex, hx: (activePointAll && activePointAll.RAP !== undefined && activePointAll.RAP !== null) ? Number(activePointAll.RAP) : NaN, hy: (activePointAll && activePointAll.PCWP !== undefined && activePointAll.PCWP !== null) ? Number(activePointAll.PCWP) : NaN };
}

// Helper to run a single case
function runCase(desc, all, activeIdx, expectedVisIndex, expectedShouldBlink){
  const res = (function(){
    const vis = Array.isArray(all) ? all.filter(r=>r.on) : [];
    if(!(activeIdx >= 0 && Array.isArray(all) && activeIdx < all.length)) return { visIndex: -1, shouldBlink:false };
    const activePointAll = all[activeIdx];
    let visIndex = -1;
    try{ visIndex = vis.findIndex(v => v === activePointAll); }catch(e){}
    if(visIndex < 0 && activePointAll && activePointAll.time !== undefined){
      try{ visIndex = vis.findIndex(v => String(v.time) === String(activePointAll.time)); }catch(e){}
    }
  const hx = (activePointAll && activePointAll.RAP !== undefined && activePointAll.RAP !== null) ? Number(activePointAll.RAP) : NaN;
  const hy = (activePointAll && activePointAll.PCWP !== undefined && activePointAll.PCWP !== null) ? Number(activePointAll.PCWP) : NaN;
    const shouldBlink = (visIndex >= 0 && Number.isFinite(hx) && Number.isFinite(hy));
    return { visIndex, hx, hy, shouldBlink };
  })();

  const pass = (res.visIndex === expectedVisIndex) && (res.shouldBlink === expectedShouldBlink);
  console.log(`${pass? 'PASS':'FAIL'} - ${desc}: visIndex=${res.visIndex}, shouldBlink=${res.shouldBlink}`);
  if(!pass){ console.log('  Expected:', { expectedVisIndex, expectedShouldBlink }); console.log('  Got:', res); }
}

// Build test objects
const tp0 = { time: '0', on: true, RAP: 8, PCWP: 10, SCAI: 'A' };
const tp1 = { time: '6', on: true, RAP: 13, PCWP: 20, SCAI: 'D' };
const tp2 = { time: '12', on: false, RAP: 10, PCWP: 15, SCAI: 'B' };
const tp3 = { time: '18', on: true, RAP: null, PCWP: 18, SCAI: 'C' };

const all = [tp0, tp1, tp2, tp3];
// visible array should be [tp0, tp1, tp3]

// Cases
runCase('active visible (tp0)', all, 0, 0, true);
runCase('active visible (tp1)', all, 1, 1, true);
runCase('active hidden (tp2)', all, 2, -1, false);
runCase('active visible but non-finite RAP (tp3)', all, 3, 2, false);

// Additional case: active pointer is object not === any vis entry but matches by time
const allCopy = [ Object.assign({}, tp0), Object.assign({}, tp1), Object.assign({}, tp2), Object.assign({}, tp3) ];
// mark on flags same
allCopy[0].on = true; allCopy[1].on = true; allCopy[2].on=false; allCopy[3].on = true;
// activeIdx refers to an object equal by time but not same identity
const activeIdx = 1; // allCopy[1]
runCase('active by time match (copied objects)', allCopy, 1, 1, true);

console.log('Test file completed.');
