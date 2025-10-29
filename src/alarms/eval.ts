// alarm evaluator helpers (TypeScript)
export type Signals = Record<string, any>;

const KEY_MAP: Record<string,string> = {
  svO2: 'SvO2',
  LSVWi: 'LVSWi',
  lsvwi: 'LVSWi',
  creatinine: 'creatinine'
};

export function normalizeKeys(obj: Signals): Signals {
  const out: Signals = {};
  for (const k of Object.keys(obj || {})) {
    const mapped = KEY_MAP[k] || k;
    out[mapped] = obj[k];
  }
  return out;
}

export function computePercentChanges(curr: Signals, prev: Signals, keys: string[] = ['CPO','CI']) {
  const out: Record<string, number> = {};
  for (const k of keys) {
    const c = curr[k];
    const p = prev[k];
    if (typeof c === 'number' && typeof p === 'number' && !isNaN(p) && p !== 0) {
      out[`${k}_pct_change`] = ((c - p) / Math.abs(p)) * 100;
    } else if (typeof c === 'number' && typeof p === 'number' && p === 0) {
      // avoid division by zero, use large change sentinel
      out[`${k}_pct_change`] = c === p ? 0 : (c > p ? Infinity : -Infinity);
    } else {
      out[`${k}_pct_change`] = NaN;
    }
  }
  return out;
}

export function DeltaFactory(prev: Signals, curr: Signals) {
  return function Delta(name: string) {
    const pn = prev[name];
    const cn = curr[name];
    if (typeof pn !== 'number' || typeof cn !== 'number') return NaN;
    return cn - pn;
  };
}

export function CountTrue(arr: any[]): number {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, v) => s + (v ? 1 : 0), 0);
}

// makeEvaluator returns a function that safely evaluates expr strings given prev/curr
export function makeEvaluator(prev: Signals, curr: Signals) {
  const nPrev = normalizeKeys(prev || {});
  const nCurr = normalizeKeys(curr || {});
  const pct = computePercentChanges(nCurr, nPrev, ['CPO','CI']);
  const Delta = DeltaFactory(nPrev, nCurr);
  return function evalExpr(expr: string): {value:boolean, error?:any, usedVars?: string[]} {
    try {
  // Build a sandbox scope with prev, curr, Delta, CountTrue and computed pct changes
  // IMPORTANT: curr must override prev when keys overlap
  const scope: any = Object.assign({}, nPrev, nCurr, pct);
      // attach helper functions
      scope.Delta = (n: string) => Delta(n);
      scope.CountTrue = (a: any[]) => CountTrue(a);

      // Create a Function that evaluates expression with scope properties as locals
      const keys = Object.keys(scope);
      const vals = keys.map(k => scope[k]);
      const fn = new Function(...keys, `return (${expr});`);
      const result = fn(...vals);
      return { value: Boolean(result) };
    } catch (err) {
      return { value: false, error: err };
    }
  };
}
