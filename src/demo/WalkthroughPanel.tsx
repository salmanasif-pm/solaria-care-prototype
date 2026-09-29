// Docked, non-blocking walkthrough card with next / back / exit and a soft highlight on the step target.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDemo } from './DemoContext';
import { Button, Icon } from '../ui';

export function WalkthroughPanel() {
  const d = useDemo();
  const loc = useLocation();
  const [min, setMin] = useState(false);

  useEffect(() => {
    const target = d.step?.target;
    if (!target) return;
    let el: Element | null = null;
    const t = setTimeout(() => {
      el = document.querySelector(`[data-tour="${target}"]`);
      if (el) { el.classList.add('tour-hl'); (el as HTMLElement).scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }
    }, 250);
    return () => { clearTimeout(t); el?.classList.remove('tour-hl'); };
  }, [d.step, loc.pathname]);

  if (!d.walk || !d.step) return null;
  const last = d.index === d.steps.length - 1;
  return (
    <aside className={`walk ${min ? 'min' : ''}`} aria-label="Guided walkthrough" data-demo>
      <header>
        <span className="walk-kicker">{d.walk.title} · {d.index + 1} / {d.steps.length}</span>
        <div className="row" style={{ gap: 2 }}>
          <button type="button" className="icon-btn sm" onClick={() => setMin(!min)} aria-label={min ? 'Expand walkthrough' : 'Minimise walkthrough'}><Icon name={min ? 'chevronDown' : 'more'} size={14} /></button>
          <button type="button" className="icon-btn sm" onClick={d.exit} aria-label="Exit walkthrough"><Icon name="x" size={14} /></button>
        </div>
      </header>
      {!min && (
        <>
          <h3>{d.step.title}</h3>
          <p>{d.step.body}</p>
          <div className="walk-dots" aria-hidden>
            {d.steps.map((_, i) => <button key={i} type="button" className={i === d.index ? 'on' : i < d.index ? 'done' : ''} onClick={() => d.to(i)} tabIndex={-1} />)}
          </div>
        </>
      )}
      <footer>
        <Button size="sm" variant="ghost" onClick={d.back} disabled={d.index === 0} icon="chevronLeft">Back</Button>
        <Button size="sm" variant="ghost" onClick={() => d.to(d.index)} title="Return to this step's screen">Go to step</Button>
        {last ? <Button size="sm" variant="primary" onClick={d.exit}>Finish</Button> : <Button size="sm" variant="primary" onClick={d.next}>Next<Icon name="chevronRight" size={14} /></Button>}
      </footer>
    </aside>
  );
}
