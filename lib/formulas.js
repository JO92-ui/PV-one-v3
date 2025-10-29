// Copied from project root formulas.js — canonical helper module inside lib/
// --- Utilidades generales ---
function mostellerBSA(h_m, w_kg) {
  if (!Number.isFinite(h_m) || !Number.isFinite(w_kg)) return null;
  return Math.sqrt((h_m * 100 * w_kg) / 3600);
}
function linspace(a, b, n) {
  const s = (b - a) / Math.max(1, n - 1);
  return Array.from({ length: n }, (_, k) => a + k * s);
}
function pct(a, b) {
  return (Number.isFinite(a) && Number.isFinite(b) && a !== 0) ? ((b - a) / a * 100) : null;
}

// --- Fórmulas hemodinámicas principales ---
function calcMAP(SBP, DBP) {
  if (!Number.isFinite(SBP) || !Number.isFinite(DBP)) return null;
  return DBP + (SBP - DBP) / 3;
}
function calcESP(SBP) {
  if (!Number.isFinite(SBP)) return null;
  return 0.9 * SBP;
}
function calcSV(CO, HR) {
  if (!Number.isFinite(CO) || !Number.isFinite(HR) || HR === 0) return null;
  return (CO * 1000) / HR;
}
function calcEa(ESP, SV) {
  if (!Number.isFinite(ESP) || !Number.isFinite(SV) || SV === 0) return null;
  return ESP / SV;
}
function calcEes(ESP, ESV, V0) {
  if (!Number.isFinite(ESP) || !Number.isFinite(ESV)) return null;
  V0 = V0 || 0;
  const denom = Math.max(1e-6, ESV - V0);
  return ESP / denom;
}
function calcVAC(Ea, Ees) {
  if (!Number.isFinite(Ea) || !Number.isFinite(Ees) || Ees === 0) return null;
  return Ea / Ees;
}
function calcSW(ESP, SV) {
  if (!Number.isFinite(ESP) || !Number.isFinite(SV)) return null;
  return ESP * SV;
}
function calcPE(ESP, ESV) {
  if (!Number.isFinite(ESP) || !Number.isFinite(ESV)) return null;
  return 0.5 * ESP * ESV;
}
function calcPVA(SW, PE) {
  if (!Number.isFinite(SW) || !Number.isFinite(PE)) return null;
  return SW + PE;
}
function calcEff(SW, PVA) {
  if (!Number.isFinite(SW) || !Number.isFinite(PVA) || PVA === 0) return null;
  return 100 * SW / PVA;
}
function calcCI(CO, BSA) {
  if (!Number.isFinite(CO) || !Number.isFinite(BSA) || BSA === 0) return null;
  return CO / BSA;
}
function calcSVI(SV, BSA) {
  if (!Number.isFinite(SV) || !Number.isFinite(BSA) || BSA === 0) return null;
  return SV / BSA;
}
function calcCPO(MAP, CO) {
  if (!Number.isFinite(MAP) || !Number.isFinite(CO)) return null;
  return MAP * CO / 451;
}
function calcCPI(CPO, BSA) {
  if (!Number.isFinite(CPO) || !Number.isFinite(BSA) || BSA === 0) return null;
  return CPO / BSA;
}
function calcCPOa(MAP, RAP, CO) {
  if (!Number.isFinite(MAP) || !Number.isFinite(RAP) || !Number.isFinite(CO)) return null;
  return (MAP - RAP) * CO / 451;
}
function calcCPIa(CPOa, BSA) {
  if (!Number.isFinite(CPOa) || !Number.isFinite(BSA) || BSA === 0) return null;
  return CPOa / BSA;
}
function calcSVR(MAP, RAP, CO) {
  if (!Number.isFinite(MAP) || !Number.isFinite(RAP) || !Number.isFinite(CO) || CO === 0) return null;
  return 80 * (MAP - RAP) / CO;
}
function calcSVRI(MAP, RAP, CI) {
  if (!Number.isFinite(MAP) || !Number.isFinite(RAP) || !Number.isFinite(CI) || CI === 0) return null;
  return 80 * (MAP - RAP) / CI;
}
function calcPVR(mPAP, PCWP, CO) {
  if (!Number.isFinite(mPAP) || !Number.isFinite(PCWP) || !Number.isFinite(CO) || CO === 0) return null;
  return (mPAP - PCWP) / CO;
}
function calcPVRI(mPAP, PCWP, CI) {
  if (!Number.isFinite(mPAP) || !Number.isFinite(PCWP) || !Number.isFinite(CI) || CI === 0) return null;
  return (mPAP - PCWP) / CI;
}
function calcPAPI(sPAP, dPAP, RAP) {
  if (!Number.isFinite(sPAP) || !Number.isFinite(dPAP) || !Number.isFinite(RAP) || RAP === 0) return null;
  return (sPAP - dPAP) / RAP;
}
function calcLVSWi(MAP, PCWP, SVI) {
  if (!Number.isFinite(MAP) || !Number.isFinite(PCWP) || !Number.isFinite(SVI)) return null;
  return (MAP - PCWP) * SVI * 0.0136;
}
function calcRVSWi(mPAP, RAP, SVI) {
  if (!Number.isFinite(mPAP) || !Number.isFinite(RAP) || !Number.isFinite(SVI)) return null;
  return (mPAP - RAP) * SVI * 0.0136;
}
function calcOPP(MAP, RAP) {
  if (!Number.isFinite(MAP) || !Number.isFinite(RAP)) return null;
  return MAP - RAP;
}
function calcCPP(DBP, PCWP) {
  if (!Number.isFinite(DBP) || !Number.isFinite(PCWP)) return null;
  return DBP - PCWP;
}
function calcLVIS(doses, W) {
  if (!doses || typeof doses !== 'object') return null;
  const vasop_kgmin = (Number.isFinite(W) && W > 0) ? (doses.Vasopressin || 0) / W : 0;
  return (doses.Dopamine || doses.Dopa || 0) + (doses.Dobutamine || doses.Dobut || 0) + 100 * (doses.Epinephrine || doses.Epi || 0) + 10 * (doses.Milrinone || 0)
    + 10000 * vasop_kgmin + 100 * (doses.Norepinephrine || doses.Norepi || 0) + 50 * (doses.Levosimendan || doses.Levo || 0);
}

// --- EDPVR params (ya estaba) ---
function edpvrParams(EDV, PCWP) {
  const An = 27.78, Bn = 2.76;
  const V0 = EDV * (0.6 - 0.006 * PCWP);
  const V30 = V0 + (EDV - V0) / Math.pow(Math.max(PCWP, 1e-6) / An, 1 / Bn);
  let beta = Math.log(Math.max(PCWP, 1e-6) / 30) / Math.log((EDV - V0) / Math.max(1e-6, (V30 - V0)));
  let alpha = 30 / Math.pow(Math.max(1e-6, (V30 - V0)), beta);
  if (!Number.isFinite(beta) || beta <= 0 || !Number.isFinite(alpha)) {
    const V15 = 0.8 * (V30 - V0) + V0;
    beta = Math.log(Math.max(PCWP, 1e-6) / 15) / Math.log((EDV - V0) / Math.max(1e-6, (V15 - V0)));
    alpha = Math.max(PCWP, 1e-6) / Math.pow(Math.max(1e-6, (EDV - V0)), beta);
  }
  return { V0, alpha, beta };
}

// Expose module and globals
;(function expose(){
  const exported = {
    mostellerBSA, linspace, pct,
    calcMAP, calcESP, calcSV, calcEa, calcEes, calcVAC,
    calcSW, calcPE, calcPVA, calcEff,
    calcCI, calcSVI, calcCPO, calcCPI, calcCPOa, calcCPIa,
    calcSVR, calcSVRI, calcPVR, calcPVRI, calcPAPI,
    calcLVSWi, calcRVSWi, calcOPP, calcCPP, calcLVIS,
    edpvrParams
  };
  try{ if(typeof module !== 'undefined' && module.exports) module.exports = exported; }catch(e){}
  try{ if(typeof window !== 'undefined') Object.assign(window, exported); }catch(e){}
  try{ if(typeof global !== 'undefined' && typeof global.window === 'undefined') Object.assign(global, exported); }catch(e){}
})();
