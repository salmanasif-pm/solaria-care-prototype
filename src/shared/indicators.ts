import type { AppState, Client } from '../domain/types';

/** Client indicators: the client's own flags plus device indicators derived from device records (4.7 / 6.1). */
export function clientIndicators(state: AppState, c: Client, includeDevices: boolean): { label: string; kind: 'device' | 'flag' }[] {
  const devices = includeDevices ? state.devices.filter((d) => d.clientId === c.id && d.active).map((d) => ({ label: `${d.type} ${d.size}`, kind: 'device' as const })) : [];
  return [...devices, ...c.indicators.map((label) => ({ label, kind: 'flag' as const }))];
}
