import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isValidDistributor, parseDistributors } from '../validateData';

const valid = {
  name: 'Blue Robotics',
  website: 'https://bluerobotics.com/',
  address: '2740 California St. Torrance, CA 90503',
  phone: '+1 (310) 620-3080',
  email: 'sales@bluerobotics.com',
  coordinates: [33.8417319, -118.3353929],
};

describe('isValidDistributor', () => {
  it('accepts a well-formed entry', () => {
    expect(isValidDistributor(valid)).toBe(true);
  });

  it('rejects a missing or empty name', () => {
    expect(isValidDistributor({ ...valid, name: '' })).toBe(false);
    expect(isValidDistributor({ ...valid, name: undefined })).toBe(false);
  });

  it('rejects malformed coordinates', () => {
    expect(isValidDistributor({ ...valid, coordinates: [1] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: ['a', 2] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: undefined })).toBe(false);
  });

  it('rejects out-of-range latitude/longitude', () => {
    expect(isValidDistributor({ ...valid, coordinates: [120, 0] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: [0, 200] })).toBe(false);
  });

  it('accepts entries with empty optional fields', () => {
    expect(isValidDistributor({ ...valid, email: '' })).toBe(true);
  });

  it('accepts exact boundary coordinates', () => {
    expect(isValidDistributor({ ...valid, coordinates: [90, 180] })).toBe(true);
    expect(isValidDistributor({ ...valid, coordinates: [-90, -180] })).toBe(true);
  });

  it('rejects a whitespace-only name', () => {
    expect(isValidDistributor({ ...valid, name: '   ' })).toBe(false);
  });
});

describe('parseDistributors', () => {
  it('keeps valid entries and drops invalid ones', () => {
    const result = parseDistributors([valid, { name: 'broken' }, 42]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Blue Robotics');
  });

  it('returns [] for non-array input', () => {
    expect(parseDistributors({})).toEqual([]);
    expect(parseDistributors(null)).toEqual([]);
  });

  it('coerces missing optional string fields to empty strings', () => {
    const [d] = parseDistributors([
      { name: 'X', coordinates: [0, 0] },
    ]);
    expect(d.website).toBe('');
    expect(d.address).toBe('');
    expect(d.phone).toBe('');
    expect(d.email).toBe('');
  });

  it('validates the real distributors.json dataset', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../../../public/distributors.json', import.meta.url), 'utf-8'),
    );
    const parsed = parseDistributors(raw);
    expect(Array.isArray(raw)).toBe(true);
    expect(parsed).toHaveLength(raw.length); // every shipped entry is valid
  });
});
