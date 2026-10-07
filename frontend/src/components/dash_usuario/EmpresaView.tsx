import { useState } from 'react';
import './EmpresaView.css';
import AltaEmpresa from './AltaEmpresa';

export default function EmpresaView() {
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [empresaData, setEmpresaData] = useState<any>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEmpresaData((prev: any) => ({...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const calcularProgreso = () => {
    if (!empresaData) return 0;
    const campos = [empresaData.nombreComercial, empresaData.rubro, empresaData.localidad, empresaData.direccion, empresaData.descripcion, empresaData.telefono, empresaData.whatsapp, empresaData.email, empresaData.sitioWeb, empresaData.instagram, empresaData.sellos];
    const completados = campos.filter(v => typeof v === 'string' && v.trim()!== '').length;
    return Math.round((completados / campos.length) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditando(false);
    setToast('¡Perfil actualizado con éxito!');
    setTimeout(() => setToast(null), 3000);
  };

  if (!empresaData) {
    return (
      <AltaEmpresa
        onComplete={(datosNuevos: any) => {
          setEmpresaData({
            nombreComercial: datosNuevos.nombreComercial,
            rubro: 'Alimentos y Bebidas',
            localidad: `${datosNuevos.localidad}, ${datosNuevos.departamento}`,
            direccion: datosNuevos.direccion,
            descripcion: '', telefono: '', whatsapp: '', email: '', sitioWeb: '', instagram: '', sellos: '', activo: true, logoUrl: ''
          });
        }}
      />
    );
  }

  const progreso = calcularProgreso();

  return (
    <div className="view-container">
      {toast && <div className="toast-notification">✅ {toast}</div>}

      <div className="content-top-row">
        <div>
          <h1>Mi Empresa</h1>
          <p>Perfil institucional visible en la Vidriera Productiva.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditando(!editando)}>
          {editando? 'Cancelar' : 'Editar Información'}
        </button>
      </div>

      <div className="top-stats-grid">
        <div className="profile-completion-card">
          <div className="completion-info">
            <span>Perfil completado</span><strong>{progreso}%</strong>
          </div>
          <div className="progress-bar-background">
            <div className="progress-bar-fill" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>
        <div className="map-status-card">
          <div>
            <span className="status-label">Estado en Mapa</span>
            <span className={`status-value ${empresaData.activo? 'is-active' : 'is-inactive'}`}>
              {empresaData.activo? '🟢 Visible (Activa)' : '🔴 Oculta (Inactiva)'}
            </span>
          </div>
          {editando && <input type="checkbox" checked={empresaData.activo} onChange={(e) => setEmpresaData({...empresaData, activo: e.target.checked })} />}
        </div>
      </div>

      <div className="empresa-card-container">
        <div className="empresa-card">
          <div className="avatar-column">
            <div className="avatar-placeholder">
              {empresaData.logoUrl? <img src={empresaData.logoUrl} alt="Logo" /> : '🏢'}
            </div>
            {editando && (
              <label className="file-input-label">
                Cambiar logo
                <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
              </label>
            )}
          </div>

          <div className="empresa-info">
            {editando? (
              <form onSubmit={handleSubmit} className="empresa-form">
                <div className="form-grid">
                  <div className="fg"><label>Nombre Comercial</label><input type="text" value={empresaData.nombreComercial} onChange={e => setEmpresaData({...empresaData, nombreComercial: e.target.value})} required /></div>
                  <div className="fg"><label>Rubro</label><select value={empresaData.rubro} onChange={e => setEmpresaData({...empresaData, rubro: e.target.value})}><option>Alimentos y Bebidas</option><option>Artesanías y Diseño</option><option>Metalúrgica y Maquinaria</option><option>Textil y Calzado</option></select></div>
                  <div className="fg full"><label>Localidad</label><input type="text" value={empresaData.localidad} onChange={e => setEmpresaData({...empresaData, localidad: e.target.value})} /></div>
                  <div className="fg full"><label>Dirección</label><input type="text" value={empresaData.direccion} onChange={e => setEmpresaData({...empresaData, direccion: e.target.value})} /></div>
                  <div className="fg full"><label>Descripción</label><textarea rows={3} value={empresaData.descripcion} onChange={e => setEmpresaData({...empresaData, descripcion: e.target.value})} required placeholder="Contá que hace tu empresa..." /></div>
                  <div className="fg"><label>Teléfono</label><input type="text" value={empresaData.telefono} onChange={e => setEmpresaData({...empresaData, telefono: e.target.value})} /></div>
                  <div className="fg"><label>WhatsApp</label><input type="text" value={empresaData.whatsapp} onChange={e => setEmpresaData({...empresaData, whatsapp: e.target.value})} /></div>
                  <div className="fg"><label>Email</label><input type="email" value={empresaData.email} onChange={e => setEmpresaData({...empresaData, email: e.target.value})} /></div>
                  <div className="fg"><label>Sitio Web</label><input type="text" value={empresaData.sitioWeb} onChange={e => setEmpresaData({...empresaData, sitioWeb: e.target.value})} /></div>
                  <div className="fg"><label>Instagram</label><input type="text" value={empresaData.instagram} onChange={e => setEmpresaData({...empresaData, instagram: e.target.value})} /></div>
                  <div className="fg"><label>Sellos</label><input type="text" value={empresaData.sellos} onChange={e => setEmpresaData({...empresaData, sellos: e.target.value})} /></div>
                </div>
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </form>
            ) : (
              <div className="empresa-details">
                <h3>{empresaData.nombreComercial}</h3>
                <span className="badge-rubro">{empresaData.rubro}</span>
                <p className="desc">{empresaData.descripcion || 'Sin descripción aún.'}</p>
                <div className="details-grid">
                  <p><strong>📍</strong> {empresaData.localidad} - {empresaData.direccion}</p>
                  <p><strong>📞</strong> {empresaData.telefono || '-'}</p>
                  <p><strong>💚</strong> {empresaData.whatsapp || '-'}</p>
                  <p><strong>✉️</strong> {empresaData.email || '-'}</p>
                  <p><strong>🌐</strong> {empresaData.sitioWeb || '-'}</p>
                  <p><strong>📸</strong> {empresaData.instagram || '-'}</p>
                  <p><strong>🏅</strong> {empresaData.sellos || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}