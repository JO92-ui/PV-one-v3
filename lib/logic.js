// lib/logic.js
// Core calculation logic extracted from index.html. This script attaches a `window.logic`
// object with calculation helpers so the non-module renderer can call into it.

(function(){
  // Prefer requiring the formulas module when available, otherwise rely on global helpers
  // provided by formulas.js (mostellerBSA, linspace, edpvrParams)
  let F = null;
  try{ if(typeof require === 'function') F = require('./formulas'); }catch(e){}
  F = F || (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));

  function _byId(id, doc=document){ return doc.getElementById(id); }

  // Pure function: compute per-timepoint derived metrics from a plain input object.
  function calcOneFromInputs(inp){
    // expects an object containing: method, H, W, on, active, time, HR, CO, LVEF, EDV, ESV, SBP, DBP,
    // sPAP, dPAP, PCWP, RAP, Lactate, Cr, SvO2, ALT, pH, OHCA, prior_therapy, mcs_for_CS, devs, doses
    const method = inp.method;
    const H = Number(inp.H), W = Number(inp.W);
  const BSA = (typeof F.mostellerBSA === 'function')? F.mostellerBSA(H,W) : null;
    const on = !!inp.on; const active = !!inp.active; const time = inp.time ?? inp.t ?? 'T';

    const HR = Number(inp.HR); let CO = Number(inp.CO);
  // Preserve raw input (percent) and compute a fractional value for internal calculations
  const LVEF_raw = Number(inp.LVEF);
  const LVEF_frac = Number.isFinite(LVEF_raw)? (LVEF_raw>1?LVEF_raw/100:LVEF_raw) : NaN;
    let EDV = Number(inp.EDV); let ESV = Number(inp.ESV);
    const SBP = Number(inp.SBP); const DBP = Number(inp.DBP);
    const sPAP = Number(inp.sPAP); const dPAP = Number(inp.dPAP);
    const PCWP = Number(inp.PCWP); const RAP = Number(inp.RAP);
  // Canonical lactate property: Lactate. Accept legacy 'Lact' too.
  const Lactate = Number(inp.Lactate ?? inp.Lact ?? NaN);
  const creatinine = Number(inp.Cr??inp.creatinine);
    const SvO2 = Number(inp.SvO2||inp.svo2); const ALT = Number(inp.ALT);
    const pH = Number(inp.pH); const OHCA = !!inp.OHCA; const prior_therapy = !!inp.prior_therapy;
    const mcs_for_CS = (inp.mcs_for_CS===undefined)? true : !!inp.mcs_for_CS;
    const devs = inp.devs || {};
    const doses = inp.doses || {};
    // Hybrid vs Manual
    // Hybrid vs Manual
    let SV = null;
    if(method==='hybrid' && Number.isFinite(CO) && Number.isFinite(HR) && Number.isFinite(LVEF_frac)){
      SV = (CO*1000)/HR;
      EDV = SV / LVEF_frac;
      ESV = EDV - SV;
    } else {
      SV = EDV - ESV;
      if(!Number.isFinite(CO) && Number.isFinite(SV) && Number.isFinite(HR)) CO = SV*HR/1000;
    }
  if(!(Number.isFinite(EDV)&&Number.isFinite(ESV)&&EDV>ESV&&Number.isFinite(SV)&&SV>0)) return null;

    const MAP = DBP + (SBP-DBP)/3;
    const mPAP = Number.isFinite(sPAP)&&Number.isFinite(dPAP) ? dPAP + (sPAP-dPAP)/3 : NaN;
    const ESP = 0.9*SBP;
    const Ea = ESP/SV;
    const Ees = ESP/ESV;
    const VAC = Ea/Ees;

    const SW = ESP*SV;
    const PE = 0.5*ESP*ESV;
    const PVA = SW + PE;
    const Eff = 100 * SW / PVA;

    const CI = (Number.isFinite(BSA)&&Number.isFinite(CO)) ? CO/BSA : null;
    const SVI = (Number.isFinite(BSA)&&Number.isFinite(SV)) ? SV/BSA : null;
    const CPO = (Number.isFinite(MAP)&&Number.isFinite(CO)) ? (MAP*CO/451) : null;
    const CPI = (Number.isFinite(BSA)&&Number.isFinite(CPO)) ? (CPO/BSA) : null;
    const CPOa = (Number.isFinite(MAP)&&Number.isFinite(RAP)&&Number.isFinite(CO)) ? ((MAP-RAP)*CO/451) : null;
    const CPIa = (Number.isFinite(BSA)&&Number.isFinite(CPOa)) ? (CPOa/BSA) : null;

    const SVR = (Number.isFinite(MAP)&&Number.isFinite(RAP)&&Number.isFinite(CO)) ? (80*(MAP-RAP)/CO) : null;
    const SVRI = (Number.isFinite(CI)&&Number.isFinite(MAP)&&Number.isFinite(RAP)) ? (80*(MAP-RAP)/CI) : null;
    const PVR_WU = (Number.isFinite(mPAP)&&Number.isFinite(PCWP)&&Number.isFinite(CO)) ? ((mPAP-PCWP)/CO) : null;
    const PVRI_WU = (Number.isFinite(mPAP)&&Number.isFinite(PCWP)&&Number.isFinite(CI)) ? ((mPAP-PCWP)/CI) : null;

    const PAPI = (Number.isFinite(sPAP)&&Number.isFinite(dPAP)&&Number.isFinite(RAP)&&RAP>0) ? ((sPAP-dPAP)/RAP) : null;

    const LVSWi = (Number.isFinite(SVI)&&Number.isFinite(MAP)&&Number.isFinite(PCWP)) ? ((MAP-PCWP)*SVI*0.0136) : null;
    const RVSWi = (Number.isFinite(SVI)&&Number.isFinite(mPAP)&&Number.isFinite(RAP)) ? ((mPAP-RAP)*SVI*0.0136) : null;
    const OPP = (Number.isFinite(MAP)&&Number.isFinite(RAP)) ? (MAP-RAP) : null;
    const CPP = (Number.isFinite(DBP)&&Number.isFinite(PCWP)) ? (DBP-PCWP) : null;

  const edp = (typeof F.edpvrParams === 'function')? F.edpvrParams(EDV, PCWP) : {V0:0, alpha:0, beta:0};
    const V0 = edp.V0, alpha = edp.alpha, beta = edp.beta;
  const V = (typeof F.linspace === 'function')? F.linspace(Math.max(5, Math.min(V0, 10)), EDV*1.4, 200) : [];
    const P_EDPVR = V.map(v=>{const dv=Math.max(v-V0,1e-6); const p=alpha*Math.pow(dv,beta); return p>150? null:p;});
    const V_fill = V.filter(v=>v>=ESV && v<=EDV);
    const P_fill = V_fill.map(v=>alpha*Math.pow(Math.max(v-V0,1e-6),beta));
    const V_loop = V_fill.concat(Array(20).fill(EDV), (typeof F.linspace==='function'? F.linspace(EDV,ESV,50) : []), Array(20).fill(ESV));
    const P_loop = P_fill.concat((typeof F.linspace==='function'? F.linspace(P_fill.at(-1), ESP, 20) : []), Array(50).fill(ESP), (typeof F.linspace==='function'? F.linspace(ESP, P_fill[0], 20) : []));
    const V_espvr = [0, EDV*1.25], P_espvr = V_espvr.map(v=>Ees*v);
    const V_ea = [ESV,EDV], P_ea = [ESP,0];

    const devicesOn = Object.values(devs||{}).filter(Boolean).length;
    const inotropesOn = ['Dobutamine','Dopamine','Milrinone','Levosimendan','Epinephrine'].filter(k=>(doses[k]||doses[k.slice(0,5)]||0)>0).length;
    const pressorsOn = ['Norepinephrine','Epinephrine','Vasopressin'].filter(k=>(doses[k]||doses[k.slice(0,5)]||0)>0).length;
    const drugsOn = Object.values(doses||{}).filter(v=>v>0).length;

  const vasop_kgmin = (Number.isFinite(W)&&W>0)? (doses.Vasopressin||0)/W : 0;
  const LVIS = (typeof F.calcLVIS === 'function') ? F.calcLVIS(doses, W) : ((doses.Dopamine||doses.Dopa||0) + (doses.Dobutamine||doses.Dobut||0) + 100*(doses.Epinephrine||doses.Epi||0) + 10*(doses.Milrinone||0)
         + 10000*vasop_kgmin + 100*(doses.Norepinephrine||doses.Norepi||0) + 50*(doses.Levosimendan||doses.Levo||0));

    return {
      on, active, time, BSA, HR, CO, CI, SVI, SBP, DBP, MAP, sPAP, dPAP, mPAP, PCWP, RAP, Lactate, ALT, pH, OHCA, prior_therapy, mcs_for_CS,
      SV,
      // Expose creatinine and SvO2 (canonical names)
      creatinine, SvO2,
      // Expose EF/LVEF as percent for rules and UI consumers. Keep fractional value internal.
      LVEF: Number.isFinite(LVEF_raw) ? LVEF_raw : null,
      EF: Number.isFinite(LVEF_raw) ? LVEF_raw : null,
      ESP, Ea, Ees, VAC, SW, PE, PVA, Eff, CPO, CPI, CPOa, CPIa,
      SVR, SVRI, PVR_WU, PVRI_WU, PAPI, LVSWi, RVSWi, OPP, CPP,
      // Device flags (top-level numeric 0/1) for rules like `Impella == 1`
      Impella: devs && typeof devs.Impella !== 'undefined' ? (devs.Impella ? 1 : 0) : 0,
      ECMO:    devs && typeof devs.ECMO    !== 'undefined' ? (devs.ECMO    ? 1 : 0) : 0,
      IABP:    devs && typeof devs.IABP    !== 'undefined' ? (devs.IABP    ? 1 : 0) : 0,
      // expose device-specific parameters if present
      Impella_level: inp.Impella_level ?? null,
      Impella_flow_Lmin: (typeof inp.Impella_flow_Lmin !== 'undefined')? inp.Impella_flow_Lmin : (typeof inp.Impella_flow !== 'undefined'? inp.Impella_flow : null),
      ECMO_rpm: inp.ECMO_rpm ?? null,
      ECMO_flow_Lmin: (typeof inp.ECMO_flow_Lmin !== 'undefined')? inp.ECMO_flow_Lmin : (typeof inp.ECMO_flow !== 'undefined'? inp.ECMO_flow : null),
      IABP_ratio: inp.IABP_ratio ?? null,
      EDV, ESV, devs, doses, devicesOn, drugsOn, inotropesOn, pressorsOn, LVIS, weight:W,
      V0_EDPVR:V0, alpha, beta, V, P_EDPVR, V_loop, P_loop, V_espvr, P_espvr, V_ea, P_ea,
      SCAI:null, SCAI_reason:'', SCAI_downgrade_flag:0, SCAI_downgrade_reason:''
    };
  }

  // DOM wrapper: read inputs from document for timepoint index i then call pure function
  function calcOne(i, doc=document){
    try{
      const method = _byId('method', doc)?.value;
      const H = parseFloat(_byId('ptH', doc)?.value), W = parseFloat(_byId('ptW', doc)?.value);
      const on = _byId(`t_on_${i}`, doc)?.checked ?? false;
      const active = _byId(`t_active_${i}`, doc)?.checked ?? false;
      const time = _byId(`t_time_${i}`, doc)?.value ?? `T${i}`;
  const rawLvefVal = _byId(`t_lvef_${i}`, doc)?.value;
  if(typeof window !== 'undefined' && window.ALARM_DEBUG){ try{ console.info('ALARM-DEBUG: calcOne DOM read', { idx: i, rawLVEF: rawLvefVal }); }catch(e){} }
  const inp = {
        method, H, W, on, active, time,
        HR: parseFloat(_byId(`t_hr_${i}`, doc)?.value),
        CO: parseFloat(_byId(`t_co_${i}`, doc)?.value),
  LVEF: parseFloat(_byId(`t_lvef_${i}`, doc)?.value),
        EDV: parseFloat(_byId(`t_edv_${i}`, doc)?.value),
        ESV: parseFloat(_byId(`t_esv_${i}`, doc)?.value),
        SBP: parseFloat(_byId(`t_sbp_${i}`, doc)?.value),
        DBP: parseFloat(_byId(`t_dbp_${i}`, doc)?.value),
        sPAP: parseFloat(_byId(`t_spap_${i}`, doc)?.value),
        dPAP: parseFloat(_byId(`t_dpap_${i}`, doc)?.value),
        PCWP: parseFloat(_byId(`t_pwp_${i}`, doc)?.value),
        RAP: parseFloat(_byId(`t_rap_${i}`, doc)?.value),
  // store under canonical name Lactate; keep Lact for backward compatibility
  Lactate: parseFloat(_byId(`t_lac_${i}`, doc)?.value),
  Lactate: parseFloat(_byId(`t_lac_${i}`, doc)?.value),
  Lact: parseFloat(_byId(`t_lac_${i}`, doc)?.value),
        Cr: parseFloat(_byId(`t_cr_${i}`, doc)?.value),
        SvO2: parseFloat(_byId(`t_svo2_${i}`, doc)?.value),
        ALT: parseFloat(_byId(`t_alt_${i}`, doc)?.value),
        pH: parseFloat(_byId(`t_ph_${i}`, doc)?.value),
        OHCA: _byId(`t_ohca_${i}`, doc)?.checked ?? false,
        prior_therapy: _byId(`t_prev_${i}`, doc)?.checked ?? false,
        mcs_for_CS: _byId(`t_mcs_cs_${i}`, doc)?.checked ?? true,
        devs: {}, doses: {},
        // device-specific UI settings (optional)
        IABP_ratio: _byId(`t_iabp_ratio_${i}`, doc)?.value ?? '',
        Impella_level: _byId(`t_impella_level_${i}`, doc)?.value ?? '',
        Impella_flow_Lmin: (function(){ const v=_byId(`t_impella_flow_${i}`, doc)?.value; const n=parseFloat(v); return Number.isFinite(n)? n : (v? v : null); })(),
        ECMO_rpm: (function(){ const v=_byId(`t_ecmo_rpm_${i}`, doc)?.value; const n=parseFloat(v); return Number.isFinite(n)? n : (v? v : null); })(),
        ECMO_flow_Lmin: (function(){ const v=_byId(`t_ecmo_flow_${i}`, doc)?.value; const n=parseFloat(v); return Number.isFinite(n)? n : (v? v : null); })()
      };
      (window.DEV_KEYS||["IABP","Impella","ECMO","VAD"]).forEach(k=> inp.devs[k] = _byId(`t_dev_${k}_${i}`, doc)?.checked ?? false);
      (window.DOSE_KEYS? Object.keys(window.DOSE_KEYS) : ['Norepinephrine','Epinephrine','Dobutamine','Dopamine','Milrinone','Vasopressin','Levosimendan']).forEach(k=> {
        const shortKey = k.slice(0,5); // backward compatibility for DOM IDs
        // Try full key id first (t_dose_Norepinephrine_0), then fall back to short key (t_dose_Norep_0)
        const fullEl = _byId(`t_dose_${k}_${i}`, doc);
        const shortEl = _byId(`t_dose_${shortKey}_${i}`, doc);
        const rawVal = (fullEl && fullEl.value !== undefined) ? fullEl.value : (shortEl && shortEl.value !== undefined ? shortEl.value : undefined);
        inp.doses[k] = parseFloat(rawVal) || 0;
      });
      return calcOneFromInputs(inp);
    }catch(e){ console.warn('logic.calcOne wrapper failed', e); return null; }
  }

  function reasonText(r, flags){
    const arr=[];
    if(flags.hypot_sev) arr.push('severe hypotension');
    if(flags.hypo_severe) arr.push('severe hypoperfusion (lact ≥10 or pH ≤7.2)');
    if(flags.supportsTotal!=null) arr.push(`total supports=${flags.supportsTotal}`);
    if(flags.OHCA) arr.push('OHCA');
    return arr.join(' · ');
  }

  function computeSCAI(vis){
    for(let i=0;i<vis.length;i++){
      const r = vis[i];
      const hypot_mild = (Number.isFinite(r.SBP)&&r.SBP>=60&&r.SBP<90) || (Number.isFinite(r.MAP)&&r.MAP>=50&&r.MAP<65);
      const hypot_sev  = (Number.isFinite(r.SBP)&&r.SBP<60) || (Number.isFinite(r.MAP)&&r.MAP<50);
      const hypoperf   = (Number.isFinite(r.Lactate)&&r.Lactate>2) || (Number.isFinite(r.pH)&&r.pH<7.30) || (Number.isFinite(r.ALT)&&r.ALT>200);
      const hypo_severe= (Number.isFinite(r.Lactate)&&r.Lactate>=10) || (Number.isFinite(r.pH)&&r.pH<=7.20);
      const hypoperf_grave = (Number.isFinite(r.Lactate)&&r.Lactate>=5) || (Number.isFinite(r.ALT)&&r.ALT>=500);
      const totalSupports = r.devicesOn + r.drugsOn;
      const deviceCS = r.mcs_for_CS && r.devicesOn>=1;

      if(hypot_sev || hypo_severe || r.drugsOn>=3 || r.devicesOn>=3 || r.OHCA){
        r.SCAI='E'; r.SCAI_reason = reasonText(r, {hypot_sev, hypo_severe, supportsTotal: totalSupports, OHCA:r.OHCA}) || '≥3 vasoactive drugs/devices'; continue;
      }
      if(totalSupports>=5){ r.SCAI='D'; r.SCAI_reason = 'D by high total support (≥5)'; continue; }
      if( ( (hypot_mild || hypot_sev) && hypoperf_grave ) ){ r.SCAI='D'; r.SCAI_reason = 'D due to hypotension + severe hypoperfusion'; continue; }
      const D_escalation = (totalSupports>=2) || (totalSupports===1 && (hypot_mild || hypoperf));
      if(D_escalation){ if(!r.prior_therapy){ r.SCAI='C'; r.SCAI_reason='C (downgrade) for new therapy without prior support'; r.SCAI_downgrade_flag=1; r.SCAI_downgrade_reason='D by escalation without prior therapy'; continue; } else { r.SCAI='D'; r.SCAI_reason='D by escalation/persistence'; continue; } }
      if(deviceCS){ r.SCAI='C'; r.SCAI_reason = 'C due to device (MCS for CS)'; continue; }
      if( ( (hypot_mild||hypot_sev) && hypoperf ) || (totalSupports===1) ){ r.SCAI='C'; r.SCAI_reason = 'C due to hypotension + hypoperfusion or single support'; continue; }
      if(hypot_mild || (Number.isFinite(r.Lactate)&&r.Lactate>=2&&r.Lactate<5) || (Number.isFinite(r.ALT)&&r.ALT>=200&&r.ALT<500)){ r.SCAI='B'; r.SCAI_reason = 'B with mild hypotension/hypoperfusion without support'; continue; }
      r.SCAI='A'; r.SCAI_reason = 'A stable (no hypotension/hypoperfusion/support)';
    }
  }

  // attach to root (window in browser, global in Node)
  const root = (typeof window !== 'undefined')? window : (typeof global !== 'undefined'? global : {});
  root.logic = root.logic || {};
  root.logic.calcOneFromInputs = calcOneFromInputs;
  root.logic.calcOne = calcOne;
  root.logic.computeSCAI = computeSCAI;
  if(typeof edpvrParams === 'function') root.logic.edpvrParams = edpvrParams;
  if(typeof mostellerBSA === 'function') root.logic.mostellerBSA = mostellerBSA;

  // CommonJS export for Node tests
  if(typeof module !== 'undefined' && module.exports){
    module.exports = root.logic;
  }
})();
