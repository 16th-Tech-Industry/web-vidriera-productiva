import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { type LatLngBoundsExpression, type LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface Coordenadas {
  lat: number;
  lng: number;
}

// Mismo rectángulo que el mapa público (components/mapa/mapa.tsx) y que
// valida el backend en el alta (UbicacionEmpresaAlta en schemas/empresas.py).
const LIMITES_CORDOBA: LatLngBoundsExpression = [
  [-35.05, -65.80],
  [-29.50, -61.70],
];

// Pin dibujado con CSS: el ícono por defecto de Leaflet busca imágenes que
// el empaquetado de Vite no copia.
const iconoPin = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px;
    height: 18px;
    background-color: #12395e;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.45);
    box-sizing: border-box;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function CapturarClick({ onSeleccionar }: { onSeleccionar: (c: Coordenadas) => void }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => onSeleccionar({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

/** Mapa chico para marcar el punto de venta: click para poner el pin, se puede arrastrar para ajustarlo. */
export function SelectorUbicacion({
  valor,
  onChange,
  alto = 220,
}: {
  valor: Coordenadas | null;
  onChange: (c: Coordenadas) => void;
  alto?: number;
}) {
  // Seis decimales (~10 cm) alcanzan y no ensucian el JSON de la empresa
  const redondear = (c: Coordenadas): Coordenadas => ({
    lat: Number(c.lat.toFixed(6)),
    lng: Number(c.lng.toFixed(6)),
  });

  return (
    <div style={{ height: alto, borderRadius: 10, overflow: 'hidden', border: '1px solid #7aadd6' }}>
      <MapContainer
        bounds={LIMITES_CORDOBA}
        maxBounds={LIMITES_CORDOBA}
        maxBoundsViscosity={1}
        minZoom={6}
        style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <CapturarClick onSeleccionar={(c) => onChange(redondear(c))} />
        {valor && (
          <Marker
            position={[valor.lat, valor.lng]}
            icon={iconoPin}
            draggable
            eventHandlers={{
              dragend: (e) => onChange(redondear((e.target as L.Marker).getLatLng())),
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
