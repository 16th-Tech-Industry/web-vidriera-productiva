// src/components/dash-usuario/ProductosView.tsx
import { useState } from 'react';
import './ProductosView.css';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  presentacion: string;
  descripcion: string;
  precio: string;
  stock: string;
  estado: 'activo' | 'oculto';
  imagen: string;
}

export default function ProductosView() {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modo, setModo] = useState<'crear' | 'editar'>('crear');
  const [productoIdEditando, setProductoIdEditando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([
    {
      id: 1,
      nombre: 'Dulce de Leche',
      categoria: 'Lácteos y Dulces',
      presentacion: 'Frasco de vidrio 450g',
      descripcion: 'Dulce de leche artesanal de campo...',
      precio: '1800',
      stock: 'En Stock',
      estado: 'activo',
      imagen: ''
    }
  ]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Lácteos y Dulces',
    presentacion: '',
    descripcion: '',
    precio: '',
    stock: 'En Stock',
    estado: 'activo' as 'activo' | 'oculto',
    imagen: ''
  });

  const abrirCreacion = () => {
    setModo('crear');
    setProductoIdEditando(null);
    setFormData({ nombre: '', categoria: 'Lácteos y Dulces', presentacion: '', descripcion: '', precio: '', stock: 'En Stock', estado: 'activo', imagen: '' });
    setPanelAbierto(true);
  };

  const abrirEdicion = (prod: Producto) => {
    setModo('editar');
    setProductoIdEditando(prod.id);
    setFormData({
      nombre: prod.nombre,
      categoria: prod.categoria,
      presentacion: prod.presentacion,
      descripcion: prod.descripcion,
      precio: prod.precio,
      stock: prod.stock,
      estado: prod.estado,
      imagen: prod.imagen
    });
    setPanelAbierto(true);
  };

  const eliminarProducto = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProductos(productos.filter(p => p.id !== id));
      setToast('Producto eliminado correctamente');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'crear') {
      const nuevoProducto: Producto = { id: Date.now(), ...formData };
      setProductos([...productos, nuevoProducto]);
      setToast('¡Producto agregado al catálogo con éxito!');
    } else {
      setProductos(productos.map((p) => (p.id === productoIdEditando ? { ...p, ...formData } : p)));
      setToast('¡Producto actualizado con éxito!');
    }
    setTimeout(() => setToast(null), 3000);
    setPanelAbierto(false);
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="view-container">
      {toast && <div className="toast-notification" role="status">✅ {toast}</div>}

      <div className="content-top-row">
        <div>
          <h1>Catálogo de Productos ({productos.length})</h1>
          <p style={{ color: '#475569' }}>Gestiona los artículos y presentaciones que ofreces en la provincia.</p>
        </div>
        <button className="btn-primary" onClick={abrirCreacion}>+ Nuevo Producto</button>
      </div>

     <div className="toolbar-container" style={{ marginBottom: '28px', marginTop: '16px' }}>
  <input type="text" placeholder="🔍 Buscar por nombre, categoría o descripción..." aria-label="Buscar productos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="search-input" />
</div>

      <div className="productos-layout">
        <div className="cards-grid">
          {productosFiltrados.length === 0 ? (
            <p className="no-results">No se encontraron productos.</p>
          ) : (
            productosFiltrados.map((prod) => (
              <article className="card-producto" key={prod.id}>
                <div className="card-header-info">
                  <span className={`badge ${prod.estado}`}>{prod.estado === 'activo' ? '🟢 Activo' : '🔴 Oculto'}</span>
                </div>
                <div className="card-img-container">
                  {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} className="card-real-img" onError={(e) => {(e.target as HTMLElement).style.display = 'none';}} /> : <div className="card-img-placeholder" aria-hidden="true">🍯</div>}
                </div>
                <span className="categoria-label">{prod.categoria}</span>
                <h2 style={{ fontSize: '1rem', margin: '4px 0' }}>{prod.nombre}</h2>
                <p className="presentacion-label">📦 {prod.presentacion}</p>
                <p className="card-desc">{prod.descripcion}</p>
                <div className="card-price-row">
                  <p className="card-price">${prod.precio}</p>
                  <span className="stock-badge">{prod.stock}</span>
                </div>
                <div className="card-actions">
                  <button className="btn-editar" onClick={() => abrirEdicion(prod)}>Editar</button>
                  <button className="btn-eliminar" aria-label={`Eliminar ${prod.nombre}`} onClick={() => eliminarProducto(prod.id)}>🗑️</button>
                </div>
              </article>
            ))
          )}
        </div>

        {panelAbierto && (
          <>
            <div className="modal-overlay" onClick={() => setPanelAbierto(false)}></div>
            <aside className="edit-panel">
              <h2 style={{ fontSize: '1.1rem' }}>{modo === 'crear' ? '✨ Nuevo Producto' : '✏️ Editar Producto'}</h2>
              <form onSubmit={handleSubmit} className="product-form">
                <label htmlFor="prod-nombre">Nombre del producto</label>
                <input id="prod-nombre" type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Miel pura de abejas" required />
                <label htmlFor="prod-categoria">Categoría</label>
                <select id="prod-categoria" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                  <option value="Lácteos y Dulces">Lácteos y Dulces</option>
                  <option value="Mieles y Derivados">Mieles y Derivados</option>
                  <option value="Embutidos y Chacinados">Embutidos y Chacinados</option>
                  <option value="Bebidas y Infusiones">Bebidas e Infusiones</option>
                  <option value="Artesanías varias">Artesanías varias</option>
                </select>
                <label htmlFor="prod-presentacion">Presentación / Envase</label>
                <input id="prod-presentacion" type="text" value={formData.presentacion} onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })} placeholder="Ej: Frasco 500g / Bidón 5L" required />
                <label htmlFor="prod-descripcion">Descripción</label>
                <textarea id="prod-descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Detalles del producto..." required />
                <label htmlFor="prod-precio">Precio ($)</label>
                <input id="prod-precio" type="number" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} placeholder="1500" required />
                <label htmlFor="prod-stock">Disponibilidad / Stock</label>
                <select id="prod-stock" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}>
                  <option value="En Stock">En Stock</option>
                  <option value="A pedido">A pedido</option>
                  <option value="Stock limitado">Stock limitado</option>
                </select>
                <label htmlFor="prod-imagen">URL de la Imagen (Opcional)</label>
                <input id="prod-imagen" type="url" value={formData.imagen} onChange={(e) => setFormData({ ...formData, imagen: e.target.value })} placeholder="https://... (enlace directo de foto)" />
                <label htmlFor="prod-estado">Estado de visibilidad</label>
                <select id="prod-estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'activo' | 'oculto' })}>
                  <option value="activo">Activo (Visible en Vidriera)</option>
                  <option value="oculto">Oculto (Borrador)</option>
                </select>
                <div className="panel-actions">
                  <button type="button" className="btn-cancel" onClick={() => setPanelAbierto(false)}>Cancelar</button>
                  <button type="submit" className="btn-save">{modo === 'crear' ? 'Guardar' : 'Actualizar'}</button>
                </div>
              </form>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}