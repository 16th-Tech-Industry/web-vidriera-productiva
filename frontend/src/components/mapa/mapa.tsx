import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L, { type LatLngBoundsExpression, type LeafletMouseEvent } from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';
import db from '../../assets/db.json';
import mapaMetros from '../../assets/dataMap.json';
import './Mapa.css';
import 'leaflet/dist/leaflet.css';

interface Productor {
  id: string | number;
  nombre: string;
  rubro: string;
  localidad: string;
  lat: number;
  lng: number;
  imagen: string;
}

const PROJ_FAJA4 = "+proj=tmerc +lat_0=-90 +lon_0=-63 +k=1 +x_0=4500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const PROJ_GRADOS = "+proj=longlat +datum=WGS84 +no_defs";

const BoundingBoxCordoba: LatLngBoundsExpression = [
  [-35.05, -65.80],
  [-29.50, -61.70]
];

export const Mapa: React.FC = () => {
  const [categoria, setCategoria] = useState<string>('Todas');
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
      html: `<div style="width: 14px; height: 14px; background-color: ${colorFondo}; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.25);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  return (
   <div className="mapa-page-wrapper">
    <div className="mapaWrapper">
      <button className="btnRestaurar" onClick={restaurarVistaProvincia}>
        🗺️ Ver Provincia Completa
      </button>

      <div className="panelFiltros">
        <select 
          className="selectRubro"
          value={categoria} 
          onChange={(e) => setCategoria(e.target.value)} 
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
        
        {filtrados.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={crearIconoCirculo(p.rubro)}>
            <Popup maxWidth={260}>
              <div className="popupContainer">
                <div className="popupImgContainer">
                  <img 
                    src={p.imagen} 
                    alt={p.nombre} 
                    className="popupImg"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                      e.currentTarget.src = "https://via.placeholder.com/150?text=Logo"; 
                    }} 
                  />
                </div>
                <h4 className="popupTitulo">{p.nombre}</h4>
                <p className="popupLocalidad">📍 {p.localidad}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
   </div>
  );
};
