import { useState, useEffect } from 'react';
import './AltaEmpresa.css';

const DEPTOS: Record<string, string[]> = {
  "Capital": ["Córdoba"],
  "Colón": ["Jesús María", "Colonia Caroya", "Villa Allende"],
  "Río Cuarto": ["Río Cuarto", "Las Higueras", "Holmberg"],
};

export default function AltaEmpresa({ onComplete }: { onComplete: (d: any) => void }) {
  const [depto, setDepto] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [form, setForm] = useState({
    nombreEmpresa: "", nombreFantasia: "", cuit: "",
    localidad: "", direccion: ""
  });

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

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

  const cardBg = isDark? '#1e293b' : '#9cc2e6';
  const borderColor = isDark? '#334155' : 'transparent';
  const textPrimary = isDark? '#f1f5f9' : '#12395e';
  const textSecondary = isDark? '#94a3b8' : '#0f2f4d';
  const labelColor = isDark? '#cbd5e1' : '#0f2f4d';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1px solid ${isDark? '#334155' : '#7aadd6'}`,
    outline: 'none',
    fontSize: '13px',
    background: isDark? '#0f172a' : '#ffffff',
    color: isDark? '#f1f5f9' : '#0f172a',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: labelColor,
    display: 'block',
    marginBottom: '6px',
    marginLeft: '4px'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '26px 28px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: isDark? '0 12px 32px rgba(0,0,0,0.35)' : '0 12px 32px rgba(15,57,94,0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: textSecondary, letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}>
            <span>MINISTERIO DE BIOAGROINDUSTRIA</span>
            <span>| Córdoba</span>
          </div>
          <h1 style={{ color: textPrimary, fontSize: '20px', margin: '8px 0 0 0', fontWeight: 800 }}>Registra tu empresa</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Departamento</label>
              <select style={inputStyle} value={depto} onChange={e=>setDepto(e.target.value)} required>
                <option value="">Departamento</option>
                {Object.keys(DEPTOS).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Localidad</label>
              <select style={{...inputStyle, opacity:!depto? 0.5 : 1}} value={form.localidad} onChange={e=>setForm({...form, localidad: e.target.value})} required disabled={!depto}>
                <option value="">Localidad</option>
                {DEPTOS[depto]?.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección de punto de venta</label>
            <input style={inputStyle} value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} placeholder="ej. Figueroa Alcorta 234" required />
          </div>

          <button type="submit" style={{
            marginTop: '8px',
            background: isDark? '#0f172a' : '#12395e',
            color: '#fff',
            padding: '13px',
            borderRadius: '12px',
            border: `1px solid ${isDark? '#334155' : '#12395e'}`,
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%'
          }}>
            Registrar empresa
          </button>
        </form>
      </div>
    </div>
  );
}