import { makeEvaluator, normalizeKeys, computePercentChanges } from './eval';

export type AlarmRule = {
  expr: string;
  color: 'critical'|'warning'|'improving'|'wean_ok'|string;
  tag: string;
  id?: string;
  label?: string;
  clinical?: string;
  suggest?: string;
};

export type AlarmGroup = { subtitle: string; items: AlarmRule[] };

const SEVERITY_ORDER = { critical: 4, warning: 3, improving: 2, wean_ok: 1 } as const;

function severityValue(color: string) {
  return SEVERITY_ORDER[color as keyof typeof SEVERITY_ORDER] || 0;
}

function groupDominance(items: Array<{rule: AlarmRule, active: boolean}>) {
  // keep only items with max severity among active ones in same group
  const active = items.filter(i => i.active);
  if (active.length === 0) return [];
  let max = 0;
  active.forEach(a => { max = Math.max(max, severityValue(a.rule.color)); });
  return active.filter(a => severityValue(a.rule.color) === max).map(a => a.rule);
}

export function getActiveAlarms(prev: Record<string, any>, curr: Record<string, any>, rules?: AlarmGroup[]) {
  // normalize inputs
  const nPrev = normalizeKeys(prev || {});
  const nCurr = normalizeKeys(curr || {});
  const pct = computePercentChanges(nCurr, nPrev, ['CPO','CI']);

  // load rules: accept provided rules or try to read global window.ALARM_RULES
  let alarmRules: AlarmGroup[] = rules || ([] as AlarmGroup[]);
  if (!alarmRules || alarmRules.length === 0) {
    // Try to access global in Node-safe way
    try {
      // @ts-ignore
      if (typeof globalThis !== 'undefined') {
        // prefer original grouped rules if the bundle created a desagrupar copy
        // the bundle stores the original in window._ALARM_RULES_ORIGINAL
        // and overwrites window.ALARM_RULES with a desagrupar array
        // Use the original when available so Smart Alarms keep the canonical grouping
        // @ts-ignore
        if ((globalThis as any)._ALARM_RULES_ORIGINAL) {
          // @ts-ignore
          alarmRules = (globalThis as any)._ALARM_RULES_ORIGINAL as AlarmGroup[];
        } else if ((globalThis as any).ALARM_RULES) {
          // @ts-ignore
          alarmRules = (globalThis as any).ALARM_RULES as AlarmGroup[];
        }
      }
    } catch (e) {
      alarmRules = [];
    }
  }

  const evaluator = makeEvaluator(nPrev, nCurr);

  const rawActive: Array<{group:string, rule: AlarmRule}> = [];

  for (const g of alarmRules) {
    const subtitle = g.subtitle || 'Other';
    for (const r of (g.items || [])) {
      const res = evaluator(r.expr);
      if (res.error) {
        // Could log missing variables; for now mark as inactive
        // eslint-disable-next-line no-console
        console.warn(`Alarm eval error for ${r.id||r.tag} expr=${r.expr}:`, res.error && res.error.message ? res.error.message : res.error);
      }
      if (res.value) {
        rawActive.push({ group: subtitle, rule: r });
      }
    }
  }

  // Global rule: if any critical or warning active, hide improving and wean_ok
  const anyCriticalOrWarning = rawActive.some(a => ['critical','warning'].includes(a.rule.color));

  // group by subtitle and apply dominance
  const groups = new Map<string, Array<{rule: AlarmRule, active:boolean}>>();
  for (const g of alarmRules) groups.set(g.subtitle || 'Other', []);
  for (const a of rawActive) {
    const arr = groups.get(a.group) || [];
    arr.push({ rule: a.rule, active: true });
    groups.set(a.group, arr);
  }

  const final: Array<{group:string, rules: AlarmRule[]}> = [];
  for (const [grp, items] of groups.entries()) {
    if (!items || items.length === 0) continue;
    // apply global hide
    let filtered = items.filter(i => i.active);
    if (anyCriticalOrWarning) {
      filtered = filtered.filter(i => !['improving','wean_ok'].includes(i.rule.color));
    }
    if (filtered.length === 0) continue;
    const dominant = groupDominance(filtered);
    if (dominant.length > 0) final.push({ group: grp, rules: dominant });
  }

  // sort groups by name then severity desc within group
  final.sort((a,b) => a.group.localeCompare(b.group));
  for (const f of final) {
    f.rules.sort((x,y) => severityValue(y.color) - severityValue(x.color));
  }

  return final;
}

// export default for convenience
export default { getActiveAlarms };
