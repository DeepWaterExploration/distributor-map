import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '../copyToClipboard';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('copyToClipboard', () => {
  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyToClipboard('hello');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard API is missing', async () => {
    vi.stubGlobal('navigator', {});
    Object.defineProperty(document, 'execCommand', {
      value: () => false,
      writable: true,
      configurable: true,
    });
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const ok = await copyToClipboard('fallback');

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('returns false when both methods fail', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    Object.defineProperty(document, 'execCommand', {
      value: () => false,
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, 'execCommand').mockReturnValue(false);

    const ok = await copyToClipboard('nope');

    expect(ok).toBe(false);
  });
});
