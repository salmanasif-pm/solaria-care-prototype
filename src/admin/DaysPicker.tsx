import { ALL_DAYS, DAY_LABELS, WEEKDAYS } from '../domain/time';
import { Button } from '../ui';

export function DaysPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      <div className="choice sm" role="group" aria-label="Days">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const on = value.includes(d);
          return <button key={d} type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}>{DAY_LABELS[d]}</button>;
        })}
      </div>
      <Button size="sm" variant="ghost" onClick={() => onChange([...WEEKDAYS])}>Weekdays</Button>
      <Button size="sm" variant="ghost" onClick={() => onChange([...ALL_DAYS])}>Every day</Button>
    </div>
  );
}
