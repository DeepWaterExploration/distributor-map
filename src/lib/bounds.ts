import type { Distributor } from './types';

export type LngLatBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export function boundsOf(distributors: Distributor[]): LngLatBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const d of distributors) {
    const [lat, lng] = d.coordinates;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLng, minLat, maxLng, maxLat };
}
