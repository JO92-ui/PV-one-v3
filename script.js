// PV One – Pestañas + PV Loops + RAP/PCWP + Tabla + Export/Import CSV (offline)

let patientCount = 0;
let showLegend = true;
let showAnnotations = true;
let showSW = true;

// ======== TABS ========
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
});

// ======== UI HELPERS ========
// Keep a professional/contrasting palette for default per-timepoint colors
const DEFAULT_PV_COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
function hslColor(i) { return DEFAULT_PV_COLORS[i % DEFAULT_PV_COLORS.length]; }
// Usar linspace de lib/formulas.js (cargada globalmente)
// Si no está disponible, fallback local
function linspace(start, end, num) {
  if(typeof window !== 'undefined' && window.linspace) return window.linspace(start, end, num);
  const arr = [];
  const step = (end - start) / Math.max(1, (num - 1));
  for (let i = 0; i < num; i++) arr.push(start + step * i);
  return arr;
}
function fmt(x, d=1){ return (isFinite(x)? x.toFixed(d):''); }
function exp(x){ return (isFinite(x)? x.toExponential(2):''); }

// ======== PATIENTS ========
function addPatient() {
  // defaults (from hemodynamics tab)
  const dRAP = parseFloat(document.getElementById('defRAP')?.value) || 12;
  const dPCP = parseFloat(document.getElementById('defPCP')?.value) || 18;
  const dSBP = parseFloat(document.getElementById('defSBP')?.value) || 120;
  const dEDV = parseFloat(document.getElementById('defEDV')?.value) || 150;
  const dESV = parseFloat(document.getElementById('defESV')?.value) || 70;

  const div = document.createElement("div");
  div.className = "input-group";
  div.id = `patient${patientCount}`;
  div.innerHTML = `
    <div>
      <label>Label:</label>
      <input type="text" id="label${patientCount}" value="Patient ${patientCount + 1}">
    </div>
    <div>
      <label>EDV:</label>
      <input type="number" id="edv${patientCount}" value="${dEDV}">
      <label>ESV:</label>
      <input type="number" id="esv${patientCount}" value="${dESV}">
      <label>SBP:</label>
      <input type="number" id="sbp${patientCount}" value="${dSBP}">
      <label>PCP:</label>
      <input type="number" id="pcp${patientCount}" value="${dPCP}">
      <label>RAP:</label>
      <input type="number" id="rap${patientCount}" value="${dRAP}">
    </div>`;
  document.getElementById("inputs").appendChild(div);
  patientCount++;
}

function clearPatients() {
  document.getElementById("inputs").innerHTML = "";
  document.querySelector('#dataTable tbody').innerHTML = "";
  try{ if(window.Plotly && typeof window.Plotly.purge === 'function') { Plotly.purge("plot"); Plotly.purge("plotHemo"); } }catch(e){}
  patientCount = 0;
}

// ======== TOGGLES ========
function toggleLegend() { showLegend = !showLegend; generateLoops(); }
function toggleLabels() { showAnnotations = !showAnnotations; generateLoops(); }
function toggleSW() { showSW = !showSW; generateLoops(); }

// ======== CÁLCULOS ========
function calcPatient(i) {
  // Gather inputs for patient i and compute simple hemodynamic derived values.
  const edv = parseFloat(document.getElementById(`edv${i}`)?.value) || 150;
  const esv = parseFloat(document.getElementById(`esv${i}`)?.value) || 70;
  const sbp = parseFloat(document.getElementById(`sbp${i}`)?.value) || 120;
  const pcp = parseFloat(document.getElementById(`pcp${i}`)?.value) || 18;
  const rap = parseFloat(document.getElementById(`rap${i}`)?.value) || 12;

  // Basic derived metrics
  const sv = Math.max(1, edv - esv); // stroke volume
  const hr = 70; // default HR (no HR input in simple UI)
  const co = (sv * hr) / 1000; // cardiac output L/min
  const ci = co / 1.7; // approximate CI using assumed BSA ~1.7 m2
  const map = sbp * 0.6 + pcp * 0.4; // crude MAP estimate

  return {
    i, edv, esv, sv, hr, co, ci, sbp, pcp, rap, map
  };
}

// ======== BADGES DE ALARMAS ACTIVAS EN CLINIC PANEL ========
function renderClinicAlarmBadges(activeAlarms) {
  const wrap = document.getElementById('clinicAlarmBadges');
  if (!wrap) return;
  if (!Array.isArray(activeAlarms) || activeAlarms.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  // Render cada alarma como badge visual
  wrap.innerHTML = activeAlarms.map(alarm => {
    // Color y emoji por severidad
    let color = '#eaf7f0', ink = '#137a3a', emoji = '🟢';
    if (alarm.color === 'critical') { color = '#ffebee'; ink = '#dc2626'; emoji = '🔴'; }
    else if (alarm.color === 'warning') { color = '#fff8ea'; ink = '#885800'; emoji = '⚠️'; }
    else if (alarm.color === 'wean_ok') { color = '#eaf2fe'; ink = '#1f6fff'; emoji = '🔵'; }
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:${color};color:${ink};font-size:13px;border:1px solid ${ink};font-weight:500">${emoji} ${alarm.label || alarm.tag}</span>`;
  }).join('');
}