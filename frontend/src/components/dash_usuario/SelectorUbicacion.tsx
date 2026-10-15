import { useState } from 'react';
import { MapContainer, Marker, Rectangle, useMapEvents } from 'react-leaflet';
import { AjustarAlContenedor, CapaBase } from '../mapa/mapaBase';
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
const RECTANGULO_CORDOBA = L.latLngBounds(LIMITES_CORDOBA);

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
  const [fueraDeCordoba, setFueraDeCordoba] = useState(false);

  // Seis decimales (~10 cm) alcanzan y no ensucian el JSON de la empresa
  const redondear = (c: Coordenadas): Coordenadas => ({
    lat: Number(c.lat.toFixed(6)),
    lng: Number(c.lng.toFixed(6)),
  });

  // El mapa muestra parte de las provincias vecinas, pero el backend solo
  // acepta puntos dentro de Córdoba: un punto de afuera se ignora con aviso.
  const seleccionar = (c: Coordenadas): boolean => {
    if (!RECTANGULO_CORDOBA.contains([c.lat, c.lng])) {
      setFueraDeCordoba(true);
      return false;
    }
    setFueraDeCordoba(false);
    onChange(redondear(c));
    return true;
  };

  return (
    <div style={{ position: 'relative', height: alto, borderRadius: 10, overflow: 'hidden', border: '1px solid #7aadd6' }}>
      <MapContainer
        bounds={LIMITES_CORDOBA}
        maxBounds={LIMITES_CORDOBA}
        maxBoundsViscosity={1}
        minZoom={6}
        style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
      >
        <CapaBase />
        <AjustarAlContenedor />
        {/* Zona donde se puede marcar */}
        <Rectangle bounds={LIMITES_CORDOBA} pathOptions={{ color: '#12395e', weight: 1.5, fill: false, dashArray: '6 4' }} interactive={false} />
        <CapturarClick onSeleccionar={seleccionar} />
        {valor && (
          <Marker
            position={[valor.lat, valor.lng]}
            icon={iconoPin}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pin = e.target as L.Marker;
                // Arrastrado fuera de Córdoba: el pin vuelve a donde estaba
                if (!seleccionar(pin.getLatLng())) pin.setLatLng([valor.lat, valor.lng]);
              },
            }}
          />
        )}
      </MapContainer>
      {fueraDeCordoba && (
        <div
          role="alert"
          style={{
            position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: 1000,
            background: '#fde8ea', color: '#b42332', borderRadius: 8,
            padding: '6px 10px', fontSize: 12, fontWeight: 600, textAlign: 'center',
          }}
        >
          Ese punto queda fuera de Córdoba: marcá uno dentro del recuadro.
        </div>
      )}
    </div>
  );
}
