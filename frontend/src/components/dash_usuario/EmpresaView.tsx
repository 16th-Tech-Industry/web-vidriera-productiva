// src/components/dash-usuario/EmpresaView.tsx
import { useState } from 'react';
import './EmpresaView.css';

export default function EmpresaView() {
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [empresaData, setEmpresaData] = useState({
    nombreComercial: 'Don Campo',
    rubro: 'Alimentos y Bebidas',
    localidad: 'Jesús María, Córdoba',
    direccion: 'Av. San Martín 1200',
    descripcion: 'Elaboración de productos artesanales de alta calidad, con ingredientes naturales.',
    telefono: '351234567',
    whatsapp: '3519876543',
    email: 'doncampo@gmail.com',
    sitioWeb: 'www.doncampo.com',
    instagram: '@doncampo_cba',
    sellos: 'Hecho en Córdoba, Sin TACC'
  });

  const calcularProgreso = () => {
    const campos = Object.values(empresaData);
    const completados = campos.filter(val => val.trim() !== '').length;
    return Math.round((completados / campos.length) * 100);
  };

  const progreso = calcularProgreso();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditando(false);
    setToast('¡Perfil institucional actualizado con éxito!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="view-container">
      {toast && <div className="toast-notification">✅ {toast}</div>}

      <div className="content-top-row">
        <div>
          <h1>Mi Empresa</h1>
          <p>Perfil institucional y logístico visible en la Vidriera Productiva.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditando(!editando)}>
          {editando ? 'Cancelar Edición' : 'Editar Información'}
        </button>
      </div>

      <div className="profile-completion-card">
        <div className="completion-info">
          <span>Perfil completado</span>
          <strong>{progreso}%</strong>
        </div>
        <div className="progress-bar-background">
          <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
        </div>
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
                <select 
                  value={empresaData.rubro}
                  onChange={(e) => setEmpresaData({ ...empresaData, rubro: e.target.value })}
                >
                  <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                  <option value="Artesanías y Diseño">Artesanías y Diseño</option>
                  <option value="Metalúrgica y Maquinaria">Metalúrgica y Maquinaria</option>
                  <option value="Textil y Calzado">Textil y Calzado</option>
                </select>

                <label>Localidad / Departamento (Córdoba)</label>
                <input 
                  type="text" 
                  value={empresaData.localidad}
                  onChange={(e) => setEmpresaData({ ...empresaData, localidad: e.target.value })}
                  placeholder="Ej: Río Cuarto, Córdoba"
                />

                <label>Dirección del Establecimiento / Planta</label>
                <input 
                  type="text" 
                  value={empresaData.direccion}
                  onChange={(e) => setEmpresaData({ ...empresaData, direccion: e.target.value })}
                />

                <label>Descripción</label>
                <textarea 
                  value={empresaData.descripcion}
                  onChange={(e) => setEmpresaData({ ...empresaData, descripcion: e.target.value })}
                  required 
                />

                <label>WhatsApp de Ventas</label>
                <input 
                  type="text" 
                  value={empresaData.whatsapp}
                  onChange={(e) => setEmpresaData({ ...empresaData, whatsapp: e.target.value })}
                  placeholder="351..."
                />

                <label>Email de contacto</label>
                <input 
                  type="email" 
                  value={empresaData.email}
                  onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })}
                />

                <label>Sitio Web / Redes</label>
                <input 
                  type="text" 
                  value={empresaData.sitioWeb}
                  onChange={(e) => setEmpresaData({ ...empresaData, sitioWeb: e.target.value })}
                />

                <label>Sellos de Calidad / Distinciones</label>
                <input 
                  type="text" 
                  value={empresaData.sellos}
                  onChange={(e) => setEmpresaData({ ...empresaData, sellos: e.target.value })}
                  placeholder="Ej: Hecho en Córdoba, Orgánico"
                />

                <button type="submit" className="btn-save" style={{ marginTop: '10px' }}>
                  Guardar Cambios
                </button>
              </form>
            ) : (
              <div className="empresa-details">
                <p><strong>🏢 Nombre Comercial:</strong> {empresaData.nombreComercial}</p>
                <p><strong>🏷️ Rubro:</strong> {empresaData.rubro}</p>
                <p><strong>📍 Ubicación:</strong> {empresaData.localidad} ({empresaData.direccion})</p>
                <p><strong>📝 Descripción:</strong> {empresaData.descripcion}</p>
                <hr style={{ border: '0', borderTop: '1px solid #d1d5db', margin: '15px 0' }} />
                <p><strong>📞 Teléfono:</strong> {empresaData.telefono}</p>
                <p><strong>💚 WhatsApp:</strong> +54 9 {empresaData.whatsapp}</p>
                <p><strong>✉️ Email:</strong> {empresaData.email}</p>
                <p><strong>🌐 Sitio web:</strong> {empresaData.sitioWeb}</p>
                <p><strong>📸 Instagram:</strong> {empresaData.instagram}</p>
                <p><strong>🏅 Sellos oficiales:</strong> <span style={{ color: '#0369a1', fontWeight: 600 }}>{empresaData.sellos}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}