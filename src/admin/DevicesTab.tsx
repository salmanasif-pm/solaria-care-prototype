// 4.7 Device records seen from Web Admin. Same single record the iPad device-care form uses.
import { useState } from 'react';
import type { Client, DeviceRecord } from '../domain/types';
import { useStore } from '../store/store';
import { fmtDate, fmtStamp } from '../domain/time';
import { Badge, Button, Card, Empty, Modal, useToast } from '../ui';
import { DeviceEditor } from '../care/forms/DeviceEditor';

export function DevicesTab({ client }: { client: Client }) {
  const { state } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<DeviceRecord | 'new' | null>(null);
  const devices = state.devices.filter((d) => d.clientId === client.id);
  const name = (id: string) => state.staff.find((s) => s.id === id)?.name ?? 'System';
  return (
    <>
      <Card title="Feeding-tube & tracheostomy devices" sub="One current record per device. Client indicators and daily device checks read from here - type and size are never re-entered elsewhere." pad={false}
        actions={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add device</Button>}>
        {devices.length === 0 ? <Empty title="No device records" hint="Add one if the client has a G-tube, NG tube or tracheostomy." icon="tube" /> : (
          <table className="table">
            <thead><tr><th>Device</th><th>Type / size</th><th>Details</th><th>Last changed</th><th>History</th><th>Status</th><th /></tr></thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className={d.active ? '' : 'inactive'}>
                  <td><strong>{d.type}</strong><div className="small muted">{d.description}</div></td>
                  <td>{d.size}</td>
                  <td className="small">{d.details}</td>
                  <td>{fmtDate(d.lastChanged)}</td>
                  <td className="small muted">{d.history.slice(-2).reverse().map((h, i) => <div key={i}>{h.text} · {name(h.by)} · {fmtStamp(h.at)}</div>)}</td>
                  <td>{d.active ? <Badge tone="green" dot>Current</Badge> : <Badge tone="neutral">Removed</Badge>}</td>
                  <td className="right"><Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(d)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing && (
        <Modal title={editing === 'new' ? 'Add device record' : `Edit ${editing.type}`} onClose={() => setEditing(null)} width={620}>
          <DeviceEditor clientId={client.id} device={editing === 'new' ? undefined : editing} onDone={(id) => { setEditing(null); if (id) toast('Device record saved'); }} />
        </Modal>
      )}
    </>
  );
}
