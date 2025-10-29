/**
 * Test script to verify all alarm rules activate correctly
 * Tests each alarm with appropriate signal values
 */

// Import the alarm engine (simulate browser environment)
const fs = require('fs');
const vm = require('vm');

// Read the bundle
const bundleCode = fs.readFileSync('alarms.bundle.js', 'utf8');

// Create a minimal browser-like environment
const context = {
  window: {},
  console: console,
  globalThis: {}
};

// Execute the bundle in the context
vm.createContext(context);
vm.runInContext(bundleCode, context);

// Get the alarm rules
const ALARM_RULES = context.window._ALARM_RULES_ORIGINAL || context.window.ALARM_RULES;

console.log(`\n=== TESTING ${countTotalAlarms(ALARM_RULES)} ALARM RULES ===\n`);

// Helper to count total alarms
function countTotalAlarms(rules) {
  return rules.reduce((sum, group) => sum + (group.items ? group.items.length : 0), 0);
}

// Implement evaluation functions directly in JavaScript
const evalFunctions = `
const KEY_MAP = {
  svO2: 'SvO2',
  LSVWi: 'LVSWi',
  lsvwi: 'LVSWi',
  creatinine: 'creatinine'
};

function normalizeKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    const mapped = KEY_MAP[k] || k;
    out[mapped] = obj[k];
  }
  return out;
}

function computePercentChanges(curr, prev, keys = ['CPO','CI']) {
  const out = {};
  for (const k of keys) {
    const c = curr[k];
    const p = prev[k];
    if (typeof c === 'number' && typeof p === 'number' && !isNaN(p) && p !== 0) {
      out[k + '_pct_change'] = ((c - p) / Math.abs(p)) * 100;
    } else if (typeof c === 'number' && typeof p === 'number' && p === 0) {
      out[k + '_pct_change'] = c === p ? 0 : (c > p ? Infinity : -Infinity);
    } else {
      out[k + '_pct_change'] = NaN;
    }
  }
  return out;
}

function DeltaFactory(prev, curr) {
  return function Delta(name) {
    const pn = prev[name];
    const cn = curr[name];
    if (typeof pn !== 'number' || typeof cn !== 'number') return NaN;
    return cn - pn;
  };
}

function CountTrue(arr) {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, v) => s + (v ? 1 : 0), 0);
}

function makeEvaluator(prev, curr) {
  const nPrev = normalizeKeys(prev || {});
  const nCurr = normalizeKeys(curr || {});
  const pct = computePercentChanges(nCurr, nPrev, ['CPO','CI']);
  const Delta = DeltaFactory(nPrev, nCurr);
  return function evalExpr(expr) {
    try {
      const scope = Object.assign({}, nPrev, nCurr, pct);
      scope.Delta = (n) => Delta(n);
      scope.CountTrue = (a) => CountTrue(a);
      const keys = Object.keys(scope);
      const vals = keys.map(k => scope[k]);
      const fn = new Function(...keys, 'return (' + expr + ');');
      const result = fn(...vals);
      return { value: Boolean(result) };
    } catch (err) {
      return { value: false, error: err };
    }
  };
}
`;

vm.runInContext(evalFunctions, context);

// Test scenarios for each alarm group
const testScenarios = {
  // Congestion alarms
  "severe_pulmonary_congestion": { PCWP: 26 },
  "moderate_pulmonary_congestion": { PCWP: 20 },
  "mild_pulmonary_congestion": { PCWP: 16 },
  "severe_systemic_congestion": { RAP: 16 },
  "moderate_systemic_congestion": { RAP: 13 },
  "biventricular_congestion": { PCWP: 19, RAP: 13 },
  "left_sided_congestion": { PCWP: 19, RAP: 10 },
  "right_sided_congestion": { PCWP: 16, RAP: 13 },
  "high_pvr": { PVR_WU: 3.5 },
  "moderate_pvr": { PVR_WU: 2.5 },
  "high_pvri": { PVRI_WU: 2.7 },
  "moderate_pvri": { PVRI_WU: 2.2 },
  "high_rap_pcwp_ratio": { RAP_PCWP_ratio: 0.85 },
  "borderline_rap_pcwp_ratio": { RAP_PCWP_ratio: 0.7 },
  "normal_rap_pcwp_ratio": { RAP_PCWP_ratio: 0.5 },
  "congestion_with_low_svo2": { PCWP: 19, SvO2: 55 },
  "mafp_candidate": { PCWP: 18, RAP: 14, Lactate: 2.5, EF: 35 },
  "extreme_systemic_congestion": { RAP: 21 },
  "pulmonary_congestion_high_pvr": { PCWP: 21, PVR_WU: 3.2 },
  "systemic_pulmonary_imbalance": { PCWP: 11, RAP: 13 },

  // Metabolic alarms
  "critical_hyperlactatemia": { Lactate: 11 },
  "severe_hyperlactatemia": { Lactate: 7 },
  "moderate_hyperlactatemia": { Lactate: 3.5 },
  "severe_acidosis": { pH: 7.15 },
  "moderate_acidosis": { pH: 7.25 },
  "alkalemia": { pH: 7.50 },
  "shock_liver": { ALT: 600 },
  "moderate_alt_elevation": { ALT: 300 },
  "lactate_rising": { Lactate: 4, prev: { Lactate: 2.5 } },
  "lactate_plateau": { Lactate: 3, prev: { Lactate: 2.8 } },
  "lactate_improving": { Lactate: 2, prev: { Lactate: 3 } },
  "creatinine_rising": { creatinine: 2.5, prev: { creatinine: 2.0 } },
  "creatinine_falling": { creatinine: 1.5, prev: { creatinine: 2.0 } },

  // Perfusion alarms
  "extremis_hypotension": { MAP: 45 },
  "severe_hypotension": { MAP: 55 },
  "low_mean_pressure": { MAP: 62 },
  "high_mean_pressure": { MAP: 90 },
  "critical_low_cardiac_index": { CI: 1.8 },
  "borderline_cardiac_index": { CI: 2.1 },
  "very_high_cardiac_index": { CI: 3.5 },
  "low_cardiac_power": { CPO: 0.5 },
  "critical_venous_desaturation": { SvO2: 45 },
  "borderline_svo2": { SvO2: 55 },
  "optimal_svo2": { SvO2: 68 },
  "high_shock_index": { Shock_index: 1.2 },
  "borderline_shock_index": { Shock_index: 0.95 },
  "low_pulse_pressure": { PulsePressure: 20 },
  "very_low_pulse_pressure": { PulsePressure: 12 },
  "normal_pulse_pressure": { PulsePressure: 45 },

  // Mixed shock
  "mixed_shock": { 
    CI: 3.0, Lactate: 2.5, pressorsOn: 1, SVR: 500, SvO2: 76,
    prev: { CI: 2.4, Lactate: 2.0, pressorsOn: 0, SVR: 650, devicesOn: 0, Impella_flow_Lmin: 0, ECMO_flow_Lmin: 0 }
  },

  // Trends
  "rising_heart_rate": { HR: 120, prev: { HR: 100 } },
  "cardiac_power_decline": { CPO: 0.6, prev: { CPO: 0.8 } },
  "cardiac_power_increase": { CPO: 0.9, prev: { CPO: 0.7 } },
  "cardiac_index_decline": { CI: 2.0, prev: { CI: 2.6 } },
  "cardiac_index_increase": { CI: 2.8, prev: { CI: 2.2 } },
  "svo2_rising": { SvO2: 65, prev: { SvO2: 58 } },
  "svo2_falling": { SvO2: 55, prev: { SvO2: 62 } },

  // MCS-specific
  "impella_flow_absent": { Impella: 1, Impella_flow_Lmin: 0.3 },
  "impella_try_wean_test": { Impella: 1, Impella_flow_Lmin: 2.0, CI: 2.2, SvO2: 60, Lactate: 2.0, pH: 7.35 },
  "impella_ready_for_removal": { Impella: 1, Impella_flow_Lmin: 0.8, CI: 2.3, SvO2: 58, Lactate: 2.2, pH: 7.32, MAP: 68 },
  "impella_removal_not_ready": { Impella: 1, CPO: 0.5, SvO2: 48 },
  "iabp_ineffective": { IABP: 1, MAP: 60, CPO: 0.55 },
  "iabp_weaning_ready": { IABP: 1, MAP: 72, CI: 2.2, RAP: 10, PCWP: 16, Lactate: 2.0, pressorsOn: 0 },
  "ecmo_weaning_ready": { ECMO: 1, CPO: 0.7, CI: 2.5, PCWP: 16, MAP: 68, SvO2: 67, Lactate: 1.8 },
  "ecmo_pump_off_success": { ECMO: 1, ECMO_flow_Lmin: 1.2, CI: 2.3, MAP: 65 },
  "ecmo_pump_off_failure": { ECMO: 1, ECMO_flow_Lmin: 1.3, CI: 2.0, MAP: 55 },
  "impella_flow_too_rapidly_reduced": { Impella_flow_Lmin: 2.0, prev: { Impella_flow_Lmin: 3.5 } },
  "combined_ecpella_weaning_ready": { Impella: 1, ECMO: 1, PAPI: 1.8, PCWP: 16, CPO: 0.65 },
  "combined_wean_failure": { Impella: 1, ECMO: 1, PAPI: 0.9, PCWP: 22 },
  "high_pvr_prevents_weaning": { PVR_WU: 3.3, Impella: 1 },
  "low_ef_prevents_weaning": { EF: 22, Impella: 0, ECMO: 1 },

  // Weaning
  "inotrope_wean_ready": { inotropesOn: 0, MAP: 68, CI: 2.6, CPO: 0.65 },
  "inotrope_wean_failure": { CI: 2.0, inotropesOn: 1, prev: { CI: 2.4, inotropesOn: 2 } },
  "post_wean_stability": { Impella: 0, MAP: 67, prev: { Impella: 1 } },
  "hemodynamic_target_met": { MAP: 67, CI: 2.6, SVR: 900, SvO2: 67, CPO: 0.65 },
  "comprehensive_weaning_success": { CPO: 0.7, PAPI: 1.2, PCWP: 16, CI: 2.5, Lactate: 2.0, pH: 7.35 },
  "comprehensive_weaning_failure": { CPO: 0.5, PAPI: 0.9 },

  // Other
  "scai_stage_d_e": { SCAI: 3 },
  "scai_stage_c": { SCAI: 2 },

  // Custom Stroke Work Rules
  "critical_low_lv_stroke_work": { LVSWi: 25 },
  "borderline_lv_stroke_work": { LVSWi: 35 },
  "normal_lv_stroke_work": { LVSWi: 45 },
  "critical_low_rv_stroke_work": { RVSWi: 5 },
  "borderline_rv_stroke_work": { RVSWi: 7 },
  "normal_rv_stroke_work": { RVSWi: 9 },
  "rv_stroke_work_decline": { RVSWi: 6, prev: { RVSWi: 7.5 } },
  "rv_stroke_work_improving": { RVSWi: 8, prev: { RVSWi: 6.5 } },

  // Custom Pressor & Inotrope Rules
  "multiple_pressors": { pressorsOn: 2 },
  "pressors_increasing": { pressorsOn: 2, prev: { pressorsOn: 1 } },
  "pressors_decreasing": { pressorsOn: 1, prev: { pressorsOn: 2 } },
  "multiple_inotropes": { inotropesOn: 2 },
  "inotropes_decreasing": { inotropesOn: 1, prev: { inotropesOn: 2 } },

  // Custom Afterload Rules
  "very_high_svr": { SVR: 1250 },
  "high_svr": { SVR: 1100 },
  "normal_svr": { SVR: 900 },
  "low_svr": { SVR: 700 },
  "very_low_svr": { SVR: 550 },

  // Custom RV Function Trending Rules
  "papi_rising": { PAPI: 1.5, prev: { PAPI: 1.1 } },
  "papi_falling": { PAPI: 0.9, prev: { PAPI: 1.3 } },

  // Custom Cardiac Power Index Rules
  "critical_low_cpi": { CPI: 0.35 },
  "borderline_cpi": { CPI: 0.45 },
  "normal_cpi": { CPI: 0.6 },
  "high_cpi": { CPI: 0.85 },

  // Custom Aortic Pulsatility Index Rules
  "critical_low_api": { API: 1.2 },
  "low_api": { API: 2.5 },
  "normal_api": { API: 3.2 },

  // Custom Coronary Perfusion Pressure Rules
  "critical_low_cpp": { CPP: 45 },
  "low_cpp": { CPP: 55 },
  "normal_cpp": { CPP: 70 },
  "high_cpp": { CPP: 85 },

  // Custom Ejection Fraction Rules
  "severe_ef_reduction": { EF: 25 },
  "moderate_ef_reduction": { EF: 35 },
  "mild_ef_reduction": { EF: 45 },
  "normal_ef": { EF: 55 },
  "ef_decline": { EF: 30, prev: { EF: 38 } },
  "ef_improvement": { EF: 40, prev: { EF: 32 } },

  // Custom Utilization Rules
  "multiple_devices_on": { devicesOn: 2 },
  "multiple_drugs_on": { drugsOn: 2 },
  "devices_increasing": { devicesOn: 2, prev: { devicesOn: 1 } },
  "devices_decreasing": { devicesOn: 1, prev: { devicesOn: 2 } },

  // ECPELLA Pathway
  "flat_line_ecmo": { ECMO: 1, PulsePressure: 3 },
  "ecpella_emergent_unload": { ECMO: 1, PCWP: 22, PulsePressure: 12 },
  "ecpella_urgent_unload": { ECMO: 1, PCWP: 19, PulsePressure: 13, prev: { PCWP: 16 } },
  "ecpella_watch": { ECMO: 1, PCWP: 19, PulsePressure: 20, prev: { PCWP: 16 } },
  "ecpella_high_risk_profile": { ECMO: 1, SCAI: 3, EF: 28, PulsePressure: 12 }
};

// Run tests
let passed = 0;
let failed = 0;
const failedAlarms = [];

ALARM_RULES.forEach(group => {
  console.log(`\n--- ${group.subtitle} ---`);
  
  group.items.forEach(rule => {
    const testData = testScenarios[rule.id];
    
    if (!testData) {
      console.log(`⚠️  ${rule.id}: NO TEST DATA`);
      failed++;
      failedAlarms.push({ id: rule.id, reason: 'No test data defined' });
      return;
    }

    // Prepare test signals
    const prev = testData.prev || {};
    const curr = { ...testData };
    delete curr.prev;

    // Create evaluator
    const makeEvaluator = context.makeEvaluator;
    const evaluator = makeEvaluator(prev, curr);
    
    // Test the expression
    const result = evaluator(rule.expr);
    
    if (result.error) {
      console.log(`❌ ${rule.id}: ERROR - ${result.error.message}`);
      failed++;
      failedAlarms.push({ id: rule.id, reason: result.error.message, expr: rule.expr });
    } else if (result.value) {
      console.log(`✅ ${rule.id}: PASS`);
      passed++;
    } else {
      console.log(`❌ ${rule.id}: FAILED TO ACTIVATE`);
      console.log(`   Expression: ${rule.expr}`);
      console.log(`   Current data:`, JSON.stringify(curr, null, 2));
      console.log(`   Previous data:`, JSON.stringify(prev, null, 2));
      failed++;
      failedAlarms.push({ id: rule.id, reason: 'Did not activate with test data', expr: rule.expr, data: { curr, prev } });
    }
  });
});

// Summary
console.log('\n\n=== TEST SUMMARY ===');
console.log(`Total alarms: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  console.log('\n=== FAILED ALARMS DETAILS ===');
  failedAlarms.forEach((fail, idx) => {
    console.log(`\n${idx + 1}. ${fail.id}`);
    console.log(`   Reason: ${fail.reason}`);
    if (fail.expr) console.log(`   Expression: ${fail.expr}`);
    if (fail.data) console.log(`   Test data: ${JSON.stringify(fail.data)}`);
  });
}

process.exit(failed > 0 ? 1 : 0);
