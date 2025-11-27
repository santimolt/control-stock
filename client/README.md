# Control de Stock - Frontend

Aplicación PWA offline-first para control de stock familiar, construida con React 19, TypeScript, Tailwind CSS y IndexedDB.

## Características

- ✅ **100% Offline**: Funciona completamente sin conexión usando IndexedDB
- ✅ **PWA Instalable**: Puede instalarse como app nativa en móviles y desktop
- ✅ **React 19**: Última versión con mejoras de rendimiento
- ✅ **TypeScript**: Type-safe en toda la aplicación
- ✅ **Tailwind CSS + shadcn/ui**: UI moderna y accesible
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar productos
- ✅ **Categorización**: Organiza productos por categorías
- ✅ **Búsqueda**: Filtra productos en tiempo real
- ✅ **Dashboard**: Estadísticas y vista general del inventario

## Stack Tecnológico

- **React 19**: Framework UI
- **TypeScript**: Type safety
- **Vite**: Build tool ultra-rápido
- **React Router v7**: Routing
- **IndexedDB (idb)**: Base de datos local
- **Tailwind CSS**: Estilos utility-first
- **shadcn/ui**: Componentes UI accesibles
- **Vite PWA Plugin**: Service Worker y caching

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar dev server
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
src/
├── types/              # Definiciones TypeScript
│   ├── product.ts      # Tipos de Product
│   └── database.ts     # Tipos de DB
├── lib/
│   ├── db/             # IndexedDB wrapper
│   │   └── index.ts    # Operaciones CRUD
│   └── utils/          # Utilidades
│       └── cn.ts       # Helper de clases CSS
├── hooks/              # Custom React hooks
│   ├── useProducts.ts  # Hook principal de productos
│   └── useDB.ts        # Hook de inicialización DB
├── components/
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Header, Layout
│   ├── products/       # ProductCard, ProductForm, ProductList
│   └── dashboard/      # StatsCard
├── pages/              # Páginas principales
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   └── NotFound.tsx
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Uso

### Agregar un Producto

1. Ve a la página "Productos"
2. Click en "Agregar Producto"
3. Completa el formulario con:
   - Nombre del producto
   - Cantidad
   - Categoría
   - Notas (opcional)
4. Click en "Guardar"

### Editar un Producto

1. Click en una tarjeta de producto o ve al detalle
2. Click en "Editar"
3. Modifica los campos necesarios
4. Click en "Guardar"

### Eliminar un Producto

1. Click en el botón "Eliminar" en la tarjeta del producto
2. Confirma la eliminación

### Buscar Productos

1. En la página "Productos", usa el campo de búsqueda
2. Escribe el nombre, categoría o notas del producto
3. Los resultados se filtran en tiempo real

## PWA - Instalación como App

### En Desktop (Chrome/Edge)

1. Abre la app en el navegador
2. Click en el ícono de instalación en la barra de direcciones
3. Sigue las instrucciones

### En iOS (Safari)

1. Abre la app en Safari
2. Tap en el botón "Compartir"
3. Selecciona "Agregar a pantalla de inicio"

### En Android (Chrome)

1. Abre la app en Chrome
2. Tap en el menú (⋮)
3. Selecciona "Instalar app" o "Agregar a pantalla de inicio"

## Desarrollo

### Comandos Útiles

```bash
# Linting
npm run lint

# Type checking
npm run tsc

# Formateo (si tienes prettier configurado)
npm run format
```

### Agregar Componentes shadcn/ui

Los componentes ya están incluidos manualmente en `src/components/ui/`. Para agregar más:

1. Copia el código del componente desde [shadcn/ui](https://ui.shadcn.com/)
2. Guárdalo en `src/components/ui/`
3. Ajusta las importaciones si es necesario

## Base de Datos (IndexedDB)

La app usa IndexedDB para almacenamiento local persistente. Los datos se guardan automáticamente en el navegador y persisten incluso después de cerrar la app.

### Schema Actual

- **Store**: `products`
- **Key**: `id` (UUID)
- **Indexes**:
  - `by-category`: Para filtrar por categoría
  - `by-updated`: Para ordenar por última actualización

### Acceso Directo a la DB

Puedes inspeccionar la DB en Chrome DevTools:

1. F12 para abrir DevTools
2. Application tab
3. Storage > IndexedDB > control-stock-db

## Próximos Pasos (Fase 2)

- [ ] Agregar campo de foto a productos
- [ ] Compresión de imágenes
- [ ] Almacenar fotos en IndexedDB como Blobs
- [ ] Preview y gestión de imágenes

## Próximos Pasos (Fase 3)

- [ ] Backend Node.js + Express
- [ ] Sincronización entre dispositivos
- [ ] Autenticación JWT
- [ ] Resolución de conflictos
- [ ] Upload de fotos a servidor

## Troubleshooting

### La app no funciona offline

- Verifica que el Service Worker esté registrado (DevTools > Application > Service Workers)
- Asegúrate de que la app esté servida sobre HTTPS (o localhost)

### Los datos no persisten

- IndexedDB puede estar deshabilitado en modo incógnito
- Verifica el storage en DevTools > Application > Storage

### Error al instalar la PWA

- Asegúrate de tener los iconos PNG en `public/icons/` (ver README en esa carpeta)
- Verifica que el manifest.json esté correctamente vinculado en index.html

## Licencia

MIT
