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
    sellos: 'Hecho en Córdoba, Sin TACC',
    activo: true, // Nuevo: Estado de visibilidad en la Vidriera
    logoUrl: ''   // Nuevo: Para almacenar la imagen o logo seleccionado
  });

  // Manejador para la carga de imágenes/logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpresaData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calcularProgreso = () => {
    // Calculamos el progreso excluyendo los booleanos o URLs opcionales si querés, 
    // o tomamos los campos de texto principales
    const camposTexto = [
      empresaData.nombreComercial,
      empresaData.rubro,
      empresaData.localidad,
      empresaData.direccion,
      empresaData.descripcion,
      empresaData.telefono,
      empresaData.whatsapp,
      empresaData.email,
      empresaData.sitioWeb,
      empresaData.instagram,
      empresaData.sellos
    ];
    const completados = camposTexto.filter(val => typeof val === 'string' && val.trim() !== '').length;
    return Math.round((completados / camposTexto.length) * 100);
  };

  const progreso = calcularProgreso();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditando(false);
    setToast('¡Perfil institucional y visibilidad actualizados con éxito!');
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

      {/* Indicador de Estado Activo/Inactivo y Progreso */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="profile-completion-card" style={{ margin: 0 }}>
          <div className="completion-info">
            <span>Perfil completado</span>
            <strong>{progreso}%</strong>
          </div>
          <div className="progress-bar-background">
            <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>

        {/* Tarjeta de Estado Visible / Oculto */}
        <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Estado en Mapa</span>
            <span style={{ fontWeight: 'bold', color: empresaData.activo ? '#16a34a' : '#dc2626', fontSize: '0.95rem' }}>
              {empresaData.activo ? '🟢 Visible (Activa)' : '🔴 Oculta (Inactiva)'}
            </span>
          </div>
          {editando && (
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={empresaData.activo} 
                onChange={(e) => setEmpresaData({ ...empresaData, activo: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#00457F' }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="empresa-card-container">
        <div className="empresa-card">
          
          {/* Avatar o Logo de la Empresa */}
          <div className="avatar-placeholder" style={{ overflow: 'hidden', padding: empresaData.logoUrl ? '0' : '15px' }}>
            {empresaData.logoUrl ? (
              <img src={empresaData.logoUrl} alt="Logo empresa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '🏢'
            )}
          </div>

          <div className="empresa-info">
            {editando ? (
              <form onSubmit={handleSubmit} className="empresa-form">
                
                <label>Logo / Imagen de la Empresa</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ padding: '6px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}
                />

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

                <label>Teléfono</label>
                <input 
                  type="text" 
                  value={empresaData.telefono}
                  onChange={(e) => setEmpresaData({ ...empresaData, telefono: e.target.value })}
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

                <label>Sitio Web</label>
                <input 
                  type="text" 
                  value={empresaData.sitioWeb}
                  onChange={(e) => setEmpresaData({ ...empresaData, sitioWeb: e.target.value })}
                />

                <label>Instagram</label>
                <input 
                  type="text" 
                  value={empresaData.instagram}
                  onChange={(e) => setEmpresaData({ ...empresaData, instagram: e.target.value })}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0 }}><strong>🏢 Nombre Comercial:</strong> {empresaData.nombreComercial}</p>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    backgroundColor: empresaData.activo ? '#dcfce7' : '#fee2e2',
                    color: empresaData.activo ? '#166534' : '#991b1b'
                  }}>
                    {empresaData.activo ? 'Activa en Mapa' : 'Inactiva'}
                  </span>
                </div>
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