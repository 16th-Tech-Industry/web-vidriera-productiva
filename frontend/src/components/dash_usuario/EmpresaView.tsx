// src/components/dash-usuario/EmpresaView.tsx
import { useState } from 'react';
import './EmpresaView.css';

export default function EmpresaView() {
  const [editando, setEditando] = useState(false);

  // Estado para los datos de la empresa
  const [empresaData, setEmpresaData] = useState({
    nombreComercial: 'Don Campo',
    rubro: 'Alimentos y Bebidas',
    descripcion: 'Elaboración de productos artesanales de alta calidad, con ingredientes naturales.',
    telefono: '351234567',
    email: 'doncampo@gmail.com',
    sitioWeb: 'www.doncampo.com'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Actualizando datos de la empresa:', empresaData);
    setEditando(false);
  };

  return (
    <div className="view-container">
      <div className="content-top-row">
        <div>
          <h1>Mi Empresa</h1>
          <p>Datos públicos que se muestran de la empresa en la plataforma.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditando(!editando)}>
          {editando ? 'Cancelar Edición' : 'Editar Información'}
        </button>
      </div>

      <div className="empresa-card-container">
        <div className="empresa-card">
          <div className="avatar-placeholder">🏢</div>

          <div className="empresa-info">
            {editando ? (
              <form onSubmit={handleSubmit} className="empresa-form">
                <label>Nombre Comercial</label>
                <input 
                  type="text" 
                  value={empresaData.nombreComercial}
                  onChange={(e) => setEmpresaData({ ...empresaData, nombreComercial: e.target.value })}
                  required 
                />

                <label>Rubro</label>
                <input 
                  type="text" 
                  value={empresaData.rubro}
                  onChange={(e) => setEmpresaData({ ...empresaData, rubro: e.target.value })}
                  required 
                />

                <label>Descripción</label>
                <textarea 
                  value={empresaData.descripcion}
                  onChange={(e) => setEmpresaData({ ...empresaData, descripcion: e.target.value })}
                  required 
                />

                <label>Teléfono</label>
                <input 
                  type="text" 
                  value={empresaData.telefono}
                  onChange={(e) => setEmpresaData({ ...empresaData, telefono: e.target.value })}
                />

                <button type="submit" className="btn-save" style={{ marginTop: '10px' }}>
                  Guardar Cambios
                </button>
              </form>
            ) : (
              <div className="empresa-details">
                <p><strong>Nombre Comercial:</strong> {empresaData.nombreComercial}</p>
                <p><strong>Rubro:</strong> {empresaData.rubro}</p>
                <p><strong>Descripción:</strong> {empresaData.descripcion}</p>
                <hr style={{ border: '0', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />
                <p><strong>Teléfono:</strong> {empresaData.telefono}</p>
                <p><strong>Email:</strong> {empresaData.email}</p>
                <p><strong>Sitio web:</strong> {empresaData.sitioWeb}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}