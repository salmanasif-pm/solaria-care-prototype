// Visible, labelled fallback for a route whose capability is switched out of scope. Never a blank page.
import { feature, type FeatureId } from '../features/registry';
import { Empty, LinkButton } from '../ui';

export function NotInScope({ feature: id, back }: { feature: FeatureId; back: string }) {
  const f = feature(id);
  return (
    <div className="page">
      <Empty icon="layers" title={`${f.label} is not in the current scope`} hint={`Roadmap ${f.roadmap.join(', ')} is switched off in the prototype Scope panel. The rest of the product keeps working without it.`}
        action={<LinkButton to={back} variant="primary">Back</LinkButton>} />
    </div>
  );
}
