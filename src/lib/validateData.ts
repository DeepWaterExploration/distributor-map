import type { Distributor } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidDistributor(value: unknown): value is Distributor {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;

  if (typeof d.name !== 'string' || d.name.trim() === '') return false;

  const coords = d.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) return false;
  if (!isFiniteNumber(lng) || lng < -180 || lng > 180) return false;

  return true;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseDistributors(raw: unknown): Distributor[] {
  if (!Array.isArray(raw)) return [];

  const result: Distributor[] = [];
  for (const item of raw) {
    if (!isValidDistributor(item)) {
      console.warn('Skipping invalid distributor entry:', item);
      continue;
    }
    const partial = item as Partial<Distributor>;
    result.push({
      name: item.name,
      website: asString(partial.website),
      address: asString(partial.address),
      phone: asString(partial.phone),
      email: asString(partial.email),
      coordinates: [item.coordinates[0], item.coordinates[1]],
    });
  }
  return result;
}
