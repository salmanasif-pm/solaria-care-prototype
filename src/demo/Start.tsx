// Prototype entry page (presenter-facing). Chooses an experience or a walkthrough.
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { useDemo } from './DemoContext';
import { WALKTHROUGHS } from './walkthroughs';
import { Icon } from '../ui';

export function Start() {
  const { actions } = useStore();
  const f = useFeatures();
  const demo = useDemo();
  const nav = useNavigate();
  const enter = (userId: string, surface: 'admin' | 'care') => { actions.signIn(userId, surface, 'demo'); nav(surface === 'admin' ? '/admin' : '/care/clients'); };
  return (
    <div className="start">
      <div className="start-inner">
        <div className="start-head">
          <span className="start-kicker">Solaria Care · pre-sales prototype</span>
          <h1>Daily care documentation, from setup to signed record</h1>
          <p>Administrative users configure clients and their care in the Web Admin. Care Staff document the day on a shared iPad. Every entry stays attributable, and completed records can be reviewed and printed.</p>
        </div>
        <div className="start-grid">
          <button type="button" className="start-card" onClick={() => enter('u_dana', 'admin')} disabled={!f.adminAvailable}>
            <span className="sc-ico"><Icon name="monitor" size={22} /></span>
            <strong>Web Admin</strong>
            <span>Administrative User · Dana Whitfield</span>
            <span className="small muted">Clients, care instructions & schedule, staff, audit trail</span>
          </button>
          <button type="button" className="start-card" onClick={() => enter('u_sarah', 'care')}>
            <span className="sc-ico"><Icon name="tablet" size={22} /></span>
            <strong>Care Staff · iPad</strong>
            <span>Sarah Mitchell, LVN</span>
            <span className="small muted">Client board, today's care, documentation, flow sheet, records</span>
          </button>
        </div>
        <div className="start-walks">
          <h2>Guided walkthroughs</h2>
          {WALKTHROUGHS.map((w) => (
            <button key={w.id} type="button" className="start-walk" onClick={() => demo.start(w.id)}>
              <Icon name="play" size={14} /><span><strong>{w.title}</strong><span className="small muted">{w.sub}</span></span>
            </button>
          ))}
        </div>
        <p className="start-foot small muted">Prototype with fictional data, stored only in this browser. It demonstrates intended workflows and controls; it is not a HIPAA-compliant system and makes no compliance claim. Use the presenter bar above to switch user, change scope, set the demo clock or reset.</p>
      </div>
    </div>
  );
}
