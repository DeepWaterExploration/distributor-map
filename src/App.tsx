import { useEffect, useState } from 'react';
import { DistributorMap } from './components/DistributorMap';
import { parseDistributors } from './lib/validateData';
import type { Distributor } from './lib/types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; distributors: Distributor[] };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}distributors.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (!cancelled) {
          setState({ status: 'ready', distributors: parseDistributors(raw) });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load distributors.json', err);
          setState({ status: 'error', message: 'Could not load distributor data.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return <div className="overlay">Loading map…</div>;
  if (state.status === 'error') return <div className="overlay">{state.message}</div>;
  return <DistributorMap distributors={state.distributors} />;
}
