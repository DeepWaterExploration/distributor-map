import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../lib/copyToClipboard';

export function CopyableRow({ icon, value }: { icon: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button type="button" className="copy-row" onClick={handleClick} title="Click to copy">
      <span className="copy-icon" aria-hidden="true">{icon}</span>
      <span className="copy-text">{value}</span>
      <span className={copied ? 'copy-flag is-visible' : 'copy-flag'}>
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  );
}
