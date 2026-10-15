import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

// Piezas comunes a los mapas de Leaflet de la app (mapa público y selector
// de ubicación del alta de empresa).

/**
 * Fondo del mapa: OpenStreetMap, que no pide clave. Las teselas de CARTO que
 * se usaban antes ahora exigen API key y se veían tapadas con "API KEY REQUIRED".
 */
export function CapaBase() {
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      maxZoom={19}
    />
  );
}

/**
 * Leaflet mide su contenedor una sola vez, al crearse. Si después cambia de
 * tamaño (se termina de cargar el CSS, se abre/cierra el sidebar, cambia la
 * ventana) dibuja solo una parte y el resto queda gris. Esto lo vuelve a
 * medir cada vez que el contenedor cambia.
 */
export function AjustarAlContenedor() {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}
