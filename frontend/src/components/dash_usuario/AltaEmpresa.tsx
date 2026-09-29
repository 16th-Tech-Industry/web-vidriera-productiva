import { useState } from 'react';

const DEPTOS: Record<string, string[]> = {
  "Capital": ["Córdoba"],
  "Colón": ["Jesús María", "Colonia Caroya", "Villa Allende"],
  "Río Cuarto": ["Río Cuarto", "Las Higueras", "Holmberg"],
};

export default function AltaEmpresa({ onComplete }: { onComplete: (d: any) => void }) {
  const [depto, setDepto] = useState("");
  const [form, setForm] = useState({
    nombreEmpresa: "", nombreFantasia: "", cuit: "",
    localidad: "", direccion: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      nombreComercial: form.nombreEmpresa,
      nombreFantasia: form.nombreFantasia,
      cuit: form.cuit,
      departamento: depto,
      localidad: form.localidad,
      direccion: form.direccion,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: 'none', outline: 'none', fontSize: '13px',
    background: '#fff', boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#fff',
    display: 'block', marginBottom: '6px', marginLeft: '4px'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 20px' }}>
      <div style={{
        background: '#7AB0E0', borderRadius: '20px',
        padding: '24px 22px', maxWidth: '380px', width: '100%',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px', marginBottom: '4px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
            <span>MINISTERIO DE BIOAGROINDUSTRIA</span>
            <span style={{ opacity: 0.8 }}>| Córdoba</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', margin: '8px 0 0 0', fontWeight: 800 }}>Registra tu empresa</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Nombre de la empresa</label>
            <input style={inputStyle} value={form.nombreEmpresa} onChange={e=>setForm({...form, nombreEmpresa: e.target.value})} placeholder="ej. Bioagroindustria" required />
          </div>

          <div>
            <label style={labelStyle}>Nombre de fantasía</label>
            <input style={inputStyle} value={form.nombreFantasia} onChange={e=>setForm({...form, nombreFantasia: e.target.value})} placeholder="ej. Agricultura y ganadería" />
          </div>

          <div>
            <label style={labelStyle}>CUIT</label>
            <input style={inputStyle} value={form.cuit} onChange={e=>setForm({...form, cuit: e.target.value})} placeholder="00-00000000-0" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Departamento</label>
              <select style={inputStyle} value={depto} onChange={e=>setDepto(e.target.value)} required>
                <option value="">Departamento</option>
                {Object.keys(DEPTOS).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Localidad</label>
              <select style={inputStyle} value={form.localidad} onChange={e=>setForm({...form, localidad: e.target.value})} required disabled={!depto}>
                <option value="">Localidad</option>
                {DEPTOS[depto]?.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección de punto de venta</label>
            <input style={inputStyle} value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} placeholder="ej. Figueroa Alcorta 234" required />
          </div>

          <button type="submit" style={{ marginTop: '6px', background: '#0f2d4a', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            Registrar empresa
          </button>
        </form>
      </div>
    </div>
  );
}