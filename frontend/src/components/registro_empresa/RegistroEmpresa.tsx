import { useState, type FormEvent } from 'react';
import logo from '../../assets/ministerio+cba.svg';
import '../Login/login.css';

interface RegistroEmpresaProps {
  onBack?: () => void;
  onSuccess?: (companyData: any) => void;
}

export function RegistroEmpresa({ onBack, onSuccess }: RegistroEmpresaProps) {
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nombreFantasia, setNombreFantasia] = useState('');
  const [cuit, setCuit] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [direccionVenta, setDireccionVenta] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validación de CUIT básico (ej. 20-12345678-9 o solo números de 11 dígitos)
  const isCuitValid = /^(\d{2}-?\d{8}-?\d{1}|\d{11})$/.test(cuit.trim());

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({
      nombreEmpresa: true,
      cuit: true,
      departamento: true,
      localidad: true,
      direccionVenta: true,
    });

    const newErrors: { [key: string]: string } = {};

    if (!nombreEmpresa.trim()) newErrors.nombreEmpresa = 'El nombre es obligatorio.';
    if (!cuit.trim()) {
      newErrors.cuit = 'El CUIT es obligatorio.';
    } else if (!isCuitValid) {
      newErrors.cuit = 'Ingresa un CUIT válido.';
    }
    if (!departamento.trim()) newErrors.departamento = 'Requerido.';
    if (!localidad.trim()) newErrors.localidad = 'Requerido.';
    if (!direccionVenta.trim()) newErrors.direccionVenta = 'La dirección es obligatoria.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setErrors({});

      try {
        // Petición hacia el endpoint de empresas
        const response = await fetch('http://localhost:8000/api/v1/companies/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_name: nombreEmpresa.trim(),
            fantasy_name: nombreFantasia.trim(),
            cuit: cuit.trim(),
            department: departamento.trim(),
            locality: localidad.trim(),
            sale_address: direccionVenta.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || 'Error al registrar la empresa.';
          setErrors({
            general: typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos.',
          });
          return;
        }

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (err) {
        setErrors({
          general: 'No se pudo conectar con el servidor backend.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getInputClass = (field: string, isValid: boolean) => {
    if (!touched[field]) return 'input-field';
    return isValid ? 'input-field input-success' : 'input-field input-error';
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo Ministerio de Bioagroindustria" className="login-logo" />

      <h2>Registra tu empresa</h2>

      {errors.general && <div className="alert-error">{errors.general}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="nombreEmpresa">Nombre de la empresa</label>
          <input
            id="nombreEmpresa"
            type="text"
            value={nombreEmpresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            onBlur={() => handleBlur('nombreEmpresa')}
            className={getInputClass('nombreEmpresa', nombreEmpresa.trim().length > 0)}
            placeholder="ej. Bioagroindustria"
          />
          {touched.nombreEmpresa && errors.nombreEmpresa && (
            <span className="error-message">{errors.nombreEmpresa}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="nombreFantasia">Nombre de Fantasía</label>
          <input
            id="nombreFantasia"
            type="text"
            value={nombreFantasia}
            onChange={(e) => setNombreFantasia(e.target.value)}
            className="input-field"
            placeholder="ej. Agricultura y ganadería"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cuit">CUIT</label>
          <input
            id="cuit"
            type="text"
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            onBlur={() => handleBlur('cuit')}
            className={getInputClass('cuit', isCuitValid)}
            placeholder="00-00000000-0"
          />
          {touched.cuit && errors.cuit && (
            <span className="error-message">{errors.cuit}</span>
          )}
        </div>

        {/* Fila doble: Departamento y Localidad */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="departamento">Departamento</label>
            <input
              id="departamento"
              type="text"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              onBlur={() => handleBlur('departamento')}
              className={getInputClass('departamento', departamento.trim().length > 0)}
              placeholder="Departamento"
            />
            {touched.departamento && errors.departamento && (
              <span className="error-message">{errors.departamento}</span>
            )}
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="localidad">Localidad</label>
            <input
              id="localidad"
              type="text"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              onBlur={() => handleBlur('localidad')}
              className={getInputClass('localidad', localidad.trim().length > 0)}
              placeholder="Localidad"
            />
            {touched.localidad && errors.localidad && (
              <span className="error-message">{errors.localidad}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="direccionVenta">Dirección de punto de venta</label>
          <input
            id="direccionVenta"
            type="text"
            value={direccionVenta}
            onChange={(e) => setDireccionVenta(e.target.value)}
            onBlur={() => handleBlur('direccionVenta')}
            className={getInputClass('direccionVenta', direccionVenta.trim().length > 0)}
            placeholder="ej. Figueroa Alcorta 534"
          />
          {touched.direccionVenta && errors.direccionVenta && (
            <span className="error-message">{errors.direccionVenta}</span>
          )}
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </form>

      {/* Indicador de pasos (Punto central activo) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1.25rem' }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ffffff' }} />
        <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#0f3a63' }} />
        <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ffffff' }} />
      </div>

      {onBack && (
        <div className="register-footer" style={{ marginTop: '1rem' }}>
          <button type="button" className="link-button register-link" onClick={onBack}>
            ← Volver atrás
          </button>
        </div>
      )}
    </div>
  );
}