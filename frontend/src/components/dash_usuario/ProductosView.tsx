// src/components/dash-usuario/ProductosView.tsx
import { useState } from 'react';
import './ProductosView.css';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
}

export default function ProductosView() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modo, setModo] = useState<'crear' | 'editar'>('crear');
  const [productoIdEditando, setProductoIdEditando] = useState<number | null>(null);

  // 1. Estado para almacenar la lista de productos (ya no es estático)
  const [productos, setProductos] = useState<Producto[]>([
    {
      id: 1,
      nombre: 'Dulce de Leche',
      descripcion: 'Dulce de leche artesanal...',
      precio: '1800'
    }
  ]);
  
  // Estado para los campos del formulario actual
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });

  const abrirCreacion = () => {
    setModo('crear');
    setProductoIdEditando(null);
    setFormData({ nombre: '', descripcion: '', precio: '' });
    setPanelAbierto(true);
  };

  const abrirEdicion = (prod: Producto) => {
    setModo('editar');
    setProductoIdEditando(prod.id);
    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio
    });
    setPanelAbierto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modo === 'crear') {
      // Creamos un nuevo producto con un ID único
      const nuevoProducto: Producto = {
        id: Date.now(),
        ...formData
      };
      setProductos([...productos, nuevoProducto]);
    } else {
      // Actualizamos el producto existente
      setProductos(
        productos.map((p) => (p.id === productoIdEditando ? { ...p, ...formData } : p))
      );
    }

    // Cerramos el panel y limpiamos
    setPanelAbierto(false);
  };

  return (
    <div className="view-container">
      <div className="content-top-row">
        <div>
          <h1>Panel de Productos</h1>
          <p>Gestiona los productos que ofrece tu PyME a la provincia.</p>
        </div>
        <button className="btn-primary" onClick={abrirCreacion}>
          + Nuevo Producto
        </button>
      </div>

      <div className="productos-layout">
        {/* Grilla dinámica de productos */}
        <div className="cards-grid">
          {productos.map((prod) => (
            <div className="card-producto" key={prod.id}>
              <div className="card-img-placeholder">🍯</div>
              <h3>{prod.nombre}</h3>
              <p>{prod.descripcion}</p>
              <p style={{ fontWeight: 'bold', color: '#16a34a' }}>${prod.precio}</p>
              <button className="btn-editar" onClick={() => abrirEdicion(prod)}>
                Editar
              </button>
            </div>
          ))}
        </div>

        {/* Panel lateral desplegable para el formulario */}
        {panelAbierto && (
          <aside className="edit-panel">
            <h3>{modo === 'crear' ? '✨ Nuevo Producto' : '✏️ Editar Producto'}</h3>
            
            <form onSubmit={handleSubmit} className="product-form">
              <label>Nombre del producto</label>
              <input 
                type="text" 
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Miel pura" 
                required 
              />

              <label>Descripción</label>
              <textarea 
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles del producto..." 
                required 
              />

              <label>Precio ($)</label>
              <input 
                type="number" 
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                placeholder="1500" 
                required
              />

              <div className="panel-actions">
                <button type="button" className="btn-cancel" onClick={() => setPanelAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {modo === 'crear' ? 'Guardar' : 'Actualizar'}
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}