// Scope preview: switch capabilities off to show the prospect what a smaller Phase 1 looks like.
import { dependents, FEATURES, feature, LAYERS, type Layer } from '../features/registry';
import { useFeatures } from '../features/FeatureContext';
import { Badge, Button, Modal, Toggle } from '../ui';

export function ScopePanel({ onClose }: { onClose: () => void }) {
  const f = useFeatures();
  return (
    <Modal title="Prototype scope" sub="Preview a leaner Phase 1. Switched-off capabilities disappear from navigation, pickers and screens; the core journey keeps working." onClose={onClose} width={760}
      footer={<><span className="small muted grow">Presenter control - not a product setting. Kept across Reset demo.</span><Button variant="primary" onClick={onClose}>Done</Button></>}>
      <div className="scope-presets">
        {LAYERS.filter((l) => l.key !== 'future').map((l) => (
          <button key={l.key} type="button" className="scope-preset" onClick={() => (l.key === 'admin' ? f.all() : f.preset(l.key as Exclude<Layer, 'future'>))}>
            <strong>{l.key === 'admin' ? 'Full Phase 1 roadmap scope' : `Up to: ${l.label}`}</strong>
            <span>{l.hint}</span>
          </button>
        ))}
      </div>
      {LAYERS.map((l) => (
        <div key={l.key} className="scope-group">
          <h3>{l.label}</h3>
          {FEATURES.filter((x) => x.layer === l.key).map((x) => {
            const effective = f.on(x.id);
            const blocked = x.removable && f.flags[x.id] && !effective;
            const deps = dependents(x.id);
            return (
              <div key={x.id} className={`scope-row ${effective ? '' : 'off'}`}>
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{x.label}</strong>
                    <span className="small muted">{x.layer === 'future' ? 'Not in Phase 1 estimate' : `Roadmap ${x.roadmap.join(', ')}`}</span>
                    <Badge tone="outline">{x.surface === 'admin' ? 'Web Admin' : x.surface === 'care' ? 'iPad' : 'Both'}</Badge>
                  </div>
                  <div className="small muted">
                    {x.summary}
                    {x.dependsOn && <> · needs {x.dependsOn.map((d) => feature(d).label).join(', ')}</>}
                    {deps.length > 0 && <> · removing it also removes {deps.map((d) => feature(d).label).join(', ')}</>}
                  </div>
                  {blocked && <div className="small" style={{ color: 'var(--amber-700)' }}>Inactive until its dependency is switched on.</div>}
                </div>
                {x.removable ? <Toggle checked={f.flags[x.id]} onChange={(v) => f.set(x.id, v)} label={<span className="sr-only">{x.label}</span>} /> : <Badge tone="blue">Core - always on</Badge>}
              </div>
            );
          })}
        </div>
      ))}
    </Modal>
  );
}
