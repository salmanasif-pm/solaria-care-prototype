// Presenter-only state: active walkthrough, device frame preference. Not proposed product functionality.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { WALKTHROUGHS, type Step, type Walkthrough } from './walkthroughs';

const FRAME_KEY = 'solaria-prototype-frame';

function useDemoValue() {
  const { state, actions } = useStore();
  const features = useFeatures();
  const nav = useNavigate();
  const [activeId, setActiveId] = useState<Walkthrough['id'] | null>(null);
  const [index, setIndex] = useState(0);
  const [frame, setFrameState] = useState<boolean>(() => { try { return localStorage.getItem(FRAME_KEY) !== 'off'; } catch { return true; } });
  const setFrame = (v: boolean) => { setFrameState(v); try { localStorage.setItem(FRAME_KEY, v ? 'on' : 'off'); } catch { /* ignore */ } };

  const walk = WALKTHROUGHS.find((w) => w.id === activeId) ?? null;
  const steps: Step[] = useMemo(() => (walk ? walk.steps.filter((s) => !s.requires || features.on(s.requires)) : []), [walk, features]);

  const go = useCallback((s: Step) => {
    if (s.user === null) { if (state.session.userId) actions.signOut('Signed out (demo walkthrough)'); }
    else if (s.user && (state.session.userId !== s.user || state.session.surface !== s.surface)) actions.signIn(s.user, s.surface ?? 'care', 'demo');
    nav(s.route);
  }, [actions, nav, state.session]);

  const start = (id: Walkthrough['id']) => {
    const w = WALKTHROUGHS.find((x) => x.id === id)!;
    if (w.preset) features.preset(w.preset); else if (!features.isFull && id !== 'lean') features.all();
    setActiveId(id);
    setIndex(0);
    const first = w.steps.find((s) => !s.requires || (w.preset ? true : features.on(s.requires)))!;
    go(first);
  };
  const to = (i: number) => { if (i < 0 || i >= steps.length) return; setIndex(i); go(steps[i]); };
  const exit = () => { setActiveId(null); setIndex(0); };

  // Keep the index valid if scope changes mid-walkthrough.
  useEffect(() => { if (walk && index >= steps.length) setIndex(Math.max(0, steps.length - 1)); }, [walk, steps.length, index]);

  return { walk, steps, index, step: steps[index] as Step | undefined, start, next: () => to(index + 1), back: () => to(index - 1), to, exit, frame, setFrame };
}

type Demo = ReturnType<typeof useDemoValue>;
const Ctx = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const v = useDemoValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemo outside provider');
  return v;
}
