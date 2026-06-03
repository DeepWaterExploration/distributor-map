import type { Distributor } from '../lib/types';
import { CopyableRow } from './CopyableRow';

export function DistributorPopup({ distributor }: { distributor: Distributor }) {
  return (
    <div className="card">
      <h2 className="card-title">{distributor.name}</h2>
      {distributor.address && <CopyableRow icon="📍" value={distributor.address} />}
      {distributor.phone && <CopyableRow icon="📞" value={distributor.phone} />}
      {distributor.email && <CopyableRow icon="✉️" value={distributor.email} />}
      {distributor.website && (
        <a
          className="card-website"
          href={distributor.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit website →
        </a>
      )}
    </div>
  );
}
