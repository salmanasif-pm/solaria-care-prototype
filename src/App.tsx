import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Surface } from './domain/types';
import { StoreProvider, useStore } from './store/store';
import { FeatureProvider, useFeature, useFeatures } from './features/FeatureContext';
import { ToastProvider } from './ui';
import { DemoProvider, useDemo } from './demo/DemoContext';
import { DemoBar } from './demo/DemoBar';
import { WalkthroughPanel } from './demo/WalkthroughPanel';
import { Start } from './demo/Start';
import { SignIn } from './auth/SignIn';
import { Activate, Forgot, Terms } from './auth/AccountPages';
import { AdminShell } from './admin/AdminShell';
import { CareShell } from './care/CareShell';
import { NotInScope } from './shared/NotInScope';

/** Protected routes need an authenticated, attributable session on the matching surface (2.3 / 7.1). */
function Guard({ surface, children }: { surface: Surface; children: ReactNode }) {
  const { state, me } = useStore();
  const terms = useFeature('termsAcceptance');
  const loc = useLocation();
  if (!me || state.session.surface !== surface) return <Navigate to={`/${surface}/signin?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (terms && me.termsAcceptedVersion !== state.termsVersion) return <Navigate to={`/${surface}/terms`} replace />;
  return <>{children}</>;
}

/** Shows the Care Staff experience inside an iPad frame on large screens (presenter preference). */
function IpadFrame({ children }: { children: ReactNode }) {
  const { frame } = useDemo();
  return <div className={`ipad-stage ${frame ? 'framed' : ''}`}><div className="ipad"><div className="ipad-screen">{children}</div></div></div>;
}

function AppRoutes() {
  const f = useFeatures();
  const lifecycle = useFeature('accountLifecycle');
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/admin/signin" element={<SignIn surface="admin" />} />
      <Route path="/admin/forgot" element={lifecycle ? <Forgot surface="admin" /> : <Navigate to="/admin/signin" replace />} />
      <Route path="/admin/terms" element={<Terms surface="admin" />} />
      <Route path="/admin/*" element={f.adminAvailable ? <Guard surface="admin"><AdminShell /></Guard> : <NotInScope feature="clientManagement" back="/care/clients" />} />
      <Route path="/care/*" element={<IpadFrame><CareRoutes /></IpadFrame>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function CareRoutes() {
  const lifecycle = useFeature('accountLifecycle');
  return (
    <Routes>
      <Route path="signin" element={<SignIn surface="care" />} />
      <Route path="activate" element={lifecycle ? <Activate /> : <Navigate to="/care/signin" replace />} />
      <Route path="forgot" element={lifecycle ? <Forgot surface="care" /> : <Navigate to="/care/signin" replace />} />
      <Route path="terms" element={<Terms surface="care" />} />
      <Route path="*" element={<Guard surface="care"><CareShell /></Guard>} />
    </Routes>
  );
}

export default function App() {
  return (
    <FeatureProvider>
      <StoreProvider>
        <ToastProvider>
          <HashRouter>
            <DemoProvider>
              <div className="app-root">
                <DemoBar />
                <div className="app-body"><AppRoutes /></div>
                <WalkthroughPanel />
              </div>
            </DemoProvider>
          </HashRouter>
        </ToastProvider>
      </StoreProvider>
    </FeatureProvider>
  );
}
