import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L, { type LatLngBoundsExpression, type LeafletMouseEvent } from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';
import db from '../../assets/db.json';
import mapaMetros from '../../assets/dataMap.json';
import './Mapa.css';
import 'leaflet/dist/leaflet.css';
import { InfoCard } from '../infoProductor/infoProductor';

type TipoCapa = 'todos' | 'empresas' | 'eventos';

interface Productor {
  id: number;
  nombre: string;
  rubro: string;
  localidad: string;
  lat: number;
  lng: number;
  imagen: string;
  descripcion: string;
}

const PROJ_FAJA4 = "+proj=tmerc +lat_0=-90 +lon_0=-63 +k=1 +x_0=4500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const PROJ_GRADOS = "+proj=longlat +datum=WGS84 +no_defs";

const BoundingBoxCordoba: LatLngBoundsExpression = [
  [-35.05, -65.80],
  [-29.50, -61.70]
];

export const Mapa: React.FC = () => {
  const [categoria, setCategoria] = useState<string>('Todas');
  const [tipoFiltro, setTipoFiltro] = useState<TipoCapa>('todos');
  const [geoJsonGrados, setGeoJsonGrados] = useState<any>(null);
  const [instanciaMapa, setInstanciaMapa] = useState<L.Map | null>(null);

  useEffect(() => {
    if (mapaMetros && mapaMetros.features) {
      try {
        const mapaClonado = JSON.parse(JSON.stringify(mapaMetros));
        mapaClonado.features = mapaClonado.features.map((feature: any) => {
          if (feature.geometry) {
            const tipo = feature.geometry.type;
            if (tipo === "MultiPolygon") {
              feature.geometry.coordinates = feature.geometry.coordinates.map((polygon: any) => 
                polygon.map((ring: any) => 
                  ring.map((coord: number[]) => Math.abs(coord[0]) > 180 ? proj4(PROJ_FAJA4, PROJ_GRADOS, [coord[0], coord[1]]) : coord)
                )
              );
            } else if (tipo === "Polygon") {
              feature.geometry.coordinates = feature.geometry.coordinates.map((ring: any) => 
                ring.map((coord: number[]) => Math.abs(coord[0]) > 180 ? proj4(PROJ_FAJA4, PROJ_GRADOS, [coord[0], coord[1]]) : coord)
              );
            }
          }
          return feature;
        });
        setGeoJsonGrados(mapaClonado);
      } catch (error) {
        console.error("Error al proyectar el mapa:", error);
      }
    }
  }, []);

  const productores: Productor[] = db.productores;
  const filtrados = categoria === 'Todas' 
    ? productores 
    : productores.filter(p => p.rubro === categoria);

  const eventosFiltrados = categoria === 'Todas'
    ? db.eventos
    : db.eventos.filter(ev => ev.categoria === categoria);

  const estiloDeptoBase: L.PathOptions = {
    fillColor: '#6ea4d2',
    weight: 1.5,
    opacity: 1,
    color: '#f8f9fa',
    fillOpacity: 0.75
  };

  const alCadaDepartamento = (departamento: any, layer: L.Layer) => {
    const props = departamento.properties || {};
    const nombreDepto = props.nombre || props.NAM || props.DEPARTAMEN || `Departamento`;
    layer.bindTooltip(nombreDepto, { sticky: true });
    
    layer.on({
      mouseover: (e: LeafletMouseEvent) => { 
        (e.target as L.Path).setStyle({ fillColor: '#00457F', fillOpacity: 0.9 }); 
      },
      mouseout: (e: LeafletMouseEvent) => { 
        (e.target as L.Path).setStyle(estiloDeptoBase); 
      },
      click: (e: LeafletMouseEvent) => {
        const layerClickeada = e.target as L.Polygon;
        const mapa = (layerClickeada as any)._map as L.Map;
        mapa.fitBounds(layerClickeada.getBounds(), {
          padding: [30, 30],
          maxZoom: 8,        
          animate: true,     
          duration: 1.2      
        });
      }
    });
  };

  const handleCambioCategoria = (nuevaCategoria: string) => {
    setCategoria(nuevaCategoria);
    
    // Si selecciona un rubro puntual, cambia automáticamente a la pestaña Empresas
    if (nuevaCategoria !== 'Todas') {
      setTipoFiltro('empresas');
    }
  };

  const restaurarVistaProvincia = () => {
    if (instanciaMapa) {
      instanciaMapa.fitBounds(BoundingBoxCordoba, {
        padding: [0, 0],
        animate: true,
        duration: 1.2
      });
    }
  };

  const crearIconoCirculo = (rubro: string): L.DivIcon => {
    let colorFondo = '#708090';
    if (rubro === 'AGROALIMENTO') colorFondo = '#f39200';
    else if (rubro === 'AGROINDUSTRIA') colorFondo = '#00aeef';
    else if (rubro === 'AGTECH') colorFondo = '#9b5de5';

    return L.divIcon({
      className: 'marcador-personalizado',
      html: `<div style="
        width: 14px;
        height: 14px;
        background-color: ${colorFondo};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        box-sizing: border-box;
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -8]
    });
  };

  return (
   <div className="mapa-page-wrapper">
    <div className="mapaWrapper">
      <button className="btnRestaurar" onClick={restaurarVistaProvincia}>
        🗺️ Ver Provincia Completa
      </button>

      <div className="panelFiltros">
        <div className="grupoFiltroTipo">
            <button
              className={`btnTipo ${tipoFiltro === 'todos' ? 'activo' : ''}`}
              onClick={() => setTipoFiltro('todos')}
            >
              Todos
            </button>
            <button
              className={`btnTipo ${tipoFiltro === 'empresas' ? 'activo' : ''}`}
              onClick={() => setTipoFiltro('empresas')}
            >
              🏢 Empresas
            </button>
            <button
              className={`btnTipo ${tipoFiltro === 'eventos' ? 'activo' : ''}`}
              onClick={() => setTipoFiltro('eventos')}
            >
              ⭐ Eventos
            </button>
          </div>
        <select 
          className="selectRubro"
          value={categoria} 
          onChange={(e) => handleCambioCategoria(e.target.value)} 
        >
          <option value="Todas">Todos los Rubros</option>
          <option value="AGROALIMENTO">Agroalimento</option>
          <option value="AGROINDUSTRIA">Agroindustria</option>
          <option value="AGTECH">Agtech</option>
        </select>

        <div className="leyenda">
          <div className="leyendaItem">
            <div className="dotAgroalimento" /> Agroalimento
          </div>
          <div className="leyendaItem">
            <div className="dotAgroindustria" /> Agroindustria
          </div>
          <div className="leyendaItem">
            <div className="dotAgtech" /> Agtech
          </div>
        </div>
      </div>

      <MapContainer 
        bounds={BoundingBoxCordoba}
        boundsOptions={{ padding: [0, 0] }}
        zoomSnap={0}
        zoomDelta={0.25}
        className="mapaLeaflet"
        zoomControl={false}
        ref={setInstanciaMapa}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />

        {geoJsonGrados && (
          <GeoJSON key={categoria} data={geoJsonGrados} style={estiloDeptoBase} onEachFeature={alCadaDepartamento} />
        )}
        {/* Marcadores de Empresas (Se muestran si tipoFiltro es 'todos' o 'empresas') */}
        {(tipoFiltro === 'todos' || tipoFiltro === 'empresas') && filtrados.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={crearIconoCirculo(p.rubro)} zIndexOffset={100}>
            <Popup maxWidth={280}>
              <InfoCard item={p} />
            </Popup>
          </Marker>
        ))}
        {/* Marcadores de Eventos (Estrellas) */}
        {(tipoFiltro === 'todos' || tipoFiltro === 'eventos') && db.eventos.map((ev) => (
          <Marker key={`ev-${ev.id}`} position={[ev.lat, ev.lng]} icon={crearIconoEstrella()}>
            <Popup maxWidth={260}>
              <div style={{ padding: '0.8rem 1rem', fontFamily: 'sans-serif' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#00457F', textTransform: 'uppercase' }}>
                  📅 Evento • {ev.categoria}
                </span>
                <h4 style={{ margin: '0.3rem 0', fontSize: '1rem', color: '#1e293b' }}>{ev.nombre}</h4>
                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: '#64748b' }}>📍 {ev.localidad}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                  {ev.fechaInicio} al {ev.fechaFin}
                </p>
              </div>
              {ev.imagen && (
                <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', marginTop: '0.25rem', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={ev.imagen}
                    alt={ev.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://via.placeholder.com/260x120?text=Sin+Imagen';
                    }}
                  />
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
   </div>
  );
};
const crearIconoEstrella = (): L.DivIcon => {
  return L.divIcon({
    className: 'marcador-evento-estrella',
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background-color: #ffd700;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-size: 14px;
      ">
        ⭐
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
};
