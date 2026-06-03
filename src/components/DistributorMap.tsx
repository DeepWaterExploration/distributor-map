import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import type { Distributor } from '../lib/types';
import { boundsOf } from '../lib/bounds';
import { DistributorPopup } from './DistributorPopup';
import '../styles/map.css';

// OpenFreeMap's free, no-API-key dark vector style. Vector tiles give crisp
// labels at any zoom; the basemap canvas is desaturated to a neutral monochrome
// look via a CSS filter in map.css (which leaves the HTML pin markers in colour).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

type PinProps = { distributor: Distributor };

function clusterSize(count: number): number {
  if (count < 10) return 34;
  if (count < 50) return 42;
  return 52;
}

export function DistributorMap({ distributors }: { distributors: Distributor[] }) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<Distributor | null>(null);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(1.2);

  const index = useMemo(() => {
    const sc = new Supercluster<PinProps>({ radius: 60, maxZoom: 14 });
    sc.load(
      distributors.map((d) => ({
        type: 'Feature' as const,
        properties: { distributor: d },
        geometry: {
          type: 'Point' as const,
          coordinates: [d.coordinates[1], d.coordinates[0]],
        },
      })),
    );
    return sc;
  }, [distributors]);

  const initialViewState = useMemo(() => {
    if (distributors.length === 0) return { longitude: 0, latitude: 20, zoom: 1.2 };
    const b = boundsOf(distributors);
    if (distributors.length === 1) {
      return { longitude: b.minLng, latitude: b.minLat, zoom: 6 };
    }
    return {
      bounds: [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: { padding: 60 },
    };
  }, [distributors]);

  const syncView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, []);

  const clusters = useMemo(() => {
    if (!bbox) return [];
    return index.getClusters(bbox, Math.round(zoom));
  }, [index, bbox, zoom]);

  // Close the popup if its pin is no longer a standalone point (e.g. it merged
  // back into a cluster after zooming out).
  useEffect(() => {
    if (!selected) return;
    const stillVisible = clusters.some(
      (f) =>
        !('cluster' in f.properties && f.properties.cluster) &&
        f.properties.distributor === selected,
    );
    if (!stillVisible) setSelected(null);
  }, [clusters, selected]);

  return (
    <Map
      ref={mapRef}
      initialViewState={initialViewState}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      minZoom={1}
      onLoad={syncView}
      onMove={syncView}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties;

        if ('cluster' in props && props.cluster) {
          const count = props.point_count;
          const size = clusterSize(count);
          return (
            <Marker
              key={`cluster-${props.cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className="cluster"
                style={{ width: size, height: size }}
                onClick={() => {
                  const target = Math.min(index.getClusterExpansionZoom(props.cluster_id), 16);
                  mapRef.current?.easeTo({ center: [lng, lat], zoom: target, duration: 500 });
                }}
              >
                {count}
              </button>
            </Marker>
          );
        }

        const d = props.distributor;
        return (
          <Marker
            key={`pin-${d.name}-${lat}-${lng}`}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <button
              type="button"
              className="pin"
              aria-label={d.name}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(d);
              }}
            />
          </Marker>
        );
      })}

      {selected && (
        <Popup
          longitude={selected.coordinates[1]}
          latitude={selected.coordinates[0]}
          anchor="bottom"
          offset={18}
          closeOnClick={true}
          onClose={() => setSelected(null)}
          className="distributor-popup"
          maxWidth="320px"
        >
          <DistributorPopup key={`${selected.name}-${selected.coordinates[0]}-${selected.coordinates[1]}`} distributor={selected} />
        </Popup>
      )}
    </Map>
  );
}
