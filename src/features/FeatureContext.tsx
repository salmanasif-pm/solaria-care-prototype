// Runtime scope switches for the presenter "Scope" panel (default: full Phase 1 roadmap, future enhancements off). Screens call useFeature(id); nothing else
// decides whether a capability is shown. Persisted separately from demo data so Reset keeps the scope.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ADMIN_FEATURES, isEffective, isRoadmapScope, presetFlags, roadmapScope, type FeatureFlags, type FeatureId, type Layer } from './registry';

const KEY = 'solaria-prototype-scope-v2';

function load(): FeatureFlags {
  const base = roadmapScope();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...base, ...(JSON.parse(raw) as Partial<FeatureFlags>) };
  } catch { /* default: everything on */ }
  return base;
}

function useFeatureValue() {
  const [flags, setFlags] = useState<FeatureFlags>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(flags)); } catch { /* ignore */ } }, [flags]);
  const on = useCallback((id: FeatureId) => isEffective(flags, id), [flags]);
  return useMemo(() => ({
    flags,
    on,
    set: (id: FeatureId, value: boolean) => setFlags((f) => ({ ...f, [id]: value })),
    preset: (layer: Exclude<Layer, 'future'>) => setFlags(presetFlags(layer)),
    all: () => setFlags(roadmapScope()),
    adminAvailable: ADMIN_FEATURES.some((id) => isEffective(flags, id)),
    isFull: isRoadmapScope(flags),
    futureOn: flags.quickSwitch,
  }), [flags, on]);
}

type Features = ReturnType<typeof useFeatureValue>;
const Ctx = createContext<Features | null>(null);
export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const v = useFeatureValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useFeatures() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFeatures outside provider');
  return v;
}
export const useFeature = (id: FeatureId) => useFeatures().on(id);

/** Render children only while the feature is in scope. */
export function Feature({ id, children, fallback = null }: { id: FeatureId; children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{useFeature(id) ? children : fallback}</>;
}
