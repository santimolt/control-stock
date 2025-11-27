# Control de Stock - Aplicación Offline-First

![Status](https://img.shields.io/badge/status-Fase%201%20Completada-success)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

Aplicación PWA para control de stock familiar, construida con React 19, TypeScript, Tailwind CSS e IndexedDB. Funciona 100% offline y puede instalarse como aplicación nativa.

> **Nota:** Este es un proyecto personal desarrollado para uso familiar. Todos los datos se almacenan localmente en tu navegador y nunca se envían a servidores externos.

## ✨ Características Implementadas (Fase 1)

- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar productos
- ✅ **100% Offline**: Funciona completamente sin conexión usando IndexedDB
- ✅ **PWA Instalable**: Puede instalarse como app nativa en móviles y desktop
- ✅ **React 19**: Última versión con mejoras de rendimiento
- ✅ **TypeScript**: Type-safe en toda la aplicación
- ✅ **Tailwind CSS + shadcn/ui**: UI moderna y accesible
- ✅ **Categorización**: Organiza productos por categorías predefinidas
- ✅ **Búsqueda**: Filtra productos en tiempo real
- ✅ **Dashboard**: Estadísticas y vista general del inventario
- ✅ **Service Worker**: Caching automático para funcionamiento offline

## 📋 Requisitos del Sistema

- **Node.js**: 18.0.0 o superior
- **npm**: 9.0.0 o superior (o yarn/pnpm equivalente)
- **Navegador moderno**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🚀 Inicio Rápido

### Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/control-stock.git
cd control-stock
```

### Instalación y Desarrollo

```bash
# Instalar dependencias
cd client
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

La aplicación estará disponible en `http://localhost:5173/`

## 📁 Estructura del Proyecto

```
control-stock/
└── client/                         # Aplicación React (Fase 1)
    ├── src/
    │   ├── types/                  # TypeScript types
    │   │   ├── product.ts          # Tipos de productos
    │   │   └── database.ts         # Tipos de IndexedDB
    │   ├── lib/
    │   │   ├── db/                 # IndexedDB wrapper
    │   │   │   └── index.ts        # Operaciones CRUD
    │   │   └── utils/              # Utilidades
    │   │       └── cn.ts           # Helper de clases CSS
    │   ├── hooks/                  # Custom React hooks
    │   │   ├── useProducts.ts      # Hook principal de productos
    │   │   └── useDB.ts            # Hook de inicialización DB
    │   ├── components/
    │   │   ├── ui/                 # Componentes base (shadcn/ui)
    │   │   ├── layout/             # Header, Layout
    │   │   ├── products/           # Componentes de productos
    │   │   └── dashboard/          # Componentes del dashboard
    │   ├── pages/                  # Páginas principales
    │   │   ├── Dashboard.tsx
    │   │   ├── Products.tsx
    │   │   ├── ProductDetail.tsx
    │   │   └── NotFound.tsx
    │   ├── App.tsx                 # Root component
    │   └── main.tsx                # Entry point
    ├── public/
    │   ├── icons/                  # Iconos PWA
    │   └── manifest.json           # PWA manifest
    └── dist/                       # Build output (generado)
```

## 📦 Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Framework** | React | 19.2.0 | UI Library |
| **Lenguaje** | TypeScript | 5.9.3 | Type Safety |
| **Build Tool** | Vite | 7.2.4 | Dev server y bundler |
| **Routing** | React Router | 7.9.6 | Navegación SPA |
| **Estilos** | Tailwind CSS | 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui | - | Componentes accesibles |
| **Base de Datos** | IndexedDB (idb) | 8.0.3 | Storage local |
| **PWA** | vite-plugin-pwa | 1.1.0 | Service Worker |

## 💡 Uso

### Gestión de Productos

1. **Agregar Producto**
   - Ve a "Productos" > Click en "Agregar Producto"
   - Completa: Nombre, Cantidad, Categoría, Notas (opcional)
   - Click en "Guardar"

2. **Ver Detalles**
   - Click en cualquier tarjeta de producto
   - Ver información completa incluyendo fechas

3. **Editar Producto**
   - En la vista de detalle > Click en "Editar"
   - Modifica los campos necesarios
   - Click en "Guardar"

4. **Eliminar Producto**
   - Click en el botón "Eliminar" en la tarjeta
   - O en la vista de detalle > "Eliminar"
   - Confirmar la eliminación

5. **Buscar Productos**
   - En la página "Productos", usa el campo de búsqueda
   - Busca por nombre, categoría o notas
   - Filtrado en tiempo real

### Dashboard

El dashboard muestra:
- **Total de Productos**: Cantidad total en inventario
- **Stock Bajo**: Productos con menos de 5 unidades
- **Sin Stock**: Productos agotados (cantidad = 0)
- **Categorías**: Número de categorías activas
- **Productos Recientes**: Los 5 productos actualizados recientemente

## 📱 Instalación como PWA

### Desktop (Chrome/Edge)
1. Abre la aplicación en el navegador
2. Click en el ícono de instalación en la barra de direcciones (⊕)
3. Click en "Instalar"

### iOS (Safari)
1. Abre en Safari
2. Tap en el botón "Compartir" (⬆️)
3. Selecciona "Agregar a pantalla de inicio"

### Android (Chrome)
1. Abre en Chrome
2. Tap en el menú (⋮)
3. Selecciona "Instalar app"

> **Nota sobre iconos:** Los iconos PNG no están incluidos. Ver `client/public/icons/README.md` para instrucciones de cómo crearlos.

## 🗄️ Base de Datos (IndexedDB)

La aplicación usa IndexedDB para almacenamiento local persistente:

- **Base de datos**: `control-stock-db`
- **Versión**: 1
- **Store**: `products`
- **Key**: `id` (UUID v4)
- **Indexes**:
  - `by-category`: Filtrar por categoría
  - `by-updated`: Ordenar por última actualización

### Inspeccionar la DB

Chrome DevTools:
1. F12 > Application tab
2. Storage > IndexedDB > `control-stock-db`
3. Puedes ver y editar datos manualmente

## 🔧 Desarrollo

### Comandos Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linting con ESLint
```

### Agregar Componentes shadcn/ui

Los componentes ya están incluidos manualmente en `src/components/ui/`:
- Button
- Card
- Input
- Label
- Textarea
- Select
- Dialog

Para agregar más:
1. Copia el código de [shadcn/ui](https://ui.shadcn.com/)
2. Guarda en `src/components/ui/`
3. Ajusta imports si es necesario

## 🗺️ Roadmap

### ✅ Fase 1 (Completada)
- CRUD de productos
- Almacenamiento local con IndexedDB
- PWA básico
- UI moderna con Tailwind

### 🔜 Fase 2 (Próxima)
- [ ] Agregar campo de foto a productos
- [ ] Compresión automática de imágenes
- [ ] Almacenar fotos en IndexedDB como Blobs
- [ ] Galería de fotos por producto
- [ ] Migración automática de datos v1→v2

### 🔮 Fase 3 (Futura)
- [ ] Backend Node.js + Express + PostgreSQL
- [ ] API REST para CRUD + sincronización
- [ ] Autenticación JWT
- [ ] Sincronización multi-dispositivo
- [ ] Resolución de conflictos
- [ ] Upload de fotos a servidor

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         UI Layer (React)                │
│  Components → Pages → Router            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Business Logic Layer               │
│  Custom Hooks → State Management        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Data Access Layer                  │
│  DB Service → IndexedDB                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Storage Layer                   │
│  IndexedDB (Browser)                    │
└─────────────────────────────────────────┘
```

### Principios de Diseño

1. **Offline-First**: IndexedDB como source of truth
2. **Progressive Enhancement**: Cada fase extiende sin romper
3. **Type Safety**: TypeScript estricto
4. **Separation of Concerns**: Capas bien definidas
5. **Zero-Config Migrations**: Versionado automático

## ❓ Troubleshooting

### La app no funciona offline
- Verifica que el Service Worker esté registrado (DevTools > Application > Service Workers)
- Asegúrate de servir sobre HTTPS (o localhost)

### Los datos no persisten
- IndexedDB puede estar deshabilitado en modo incógnito
- Verifica storage en DevTools > Application > Storage

### Error al instalar PWA
- Asegúrate de tener iconos PNG en `public/icons/` (ver README en esa carpeta)
- Verifica que `manifest.json` esté vinculado en `index.html`

### Build falla
- Verifica que estés usando Node.js 18+ y npm 9+
- Elimina `node_modules` y `package-lock.json`, luego `npm install`

## 🔒 Seguridad y Privacidad

### Privacidad de Datos

- **100% Local**: Todos los datos se almacenan exclusivamente en tu navegador usando IndexedDB
- **Sin Tracking**: La aplicación no incluye ningún sistema de analytics, tracking o telemetría
- **Sin Servidores**: No se envían datos a servidores externos, ni siquiera en modo desarrollo
- **Sin Cookies**: La aplicación no utiliza cookies ni almacenamiento de sesión

### Seguridad

- **Sin API Keys**: La aplicación no requiere ni utiliza claves de API
- **Sin Autenticación Externa**: No hay integración con servicios de terceros que requieran credenciales
- **Código Abierto**: Todo el código es público y puede ser auditado

> **Importante**: Los datos almacenados en IndexedDB son específicos de cada navegador y dispositivo. Si limpias los datos del navegador, perderás toda la información almacenada.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Este es un proyecto personal, pero si encuentras bugs o tienes ideas para mejoras, no dudes en:

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### Guías de Contribución

- Mantén el código limpio y bien documentado
- Sigue las convenciones de código existentes
- Agrega comentarios cuando sea necesario
- Prueba tus cambios antes de hacer commit
- Actualiza la documentación si es necesario

## 🐛 Reportar Issues

Si encuentras un bug o tienes una sugerencia:

1. **Busca** si el issue ya existe en la sección de Issues
2. Si no existe, **crea** un nuevo issue con:
   - Descripción clara del problema o sugerencia
   - Pasos para reproducir (si es un bug)
   - Comportamiento esperado vs. comportamiento actual
   - Información del entorno (navegador, versión de Node.js, etc.)
   - Capturas de pantalla si aplica

### Tipos de Issues

- 🐛 **Bug**: Algo no funciona como debería
- 💡 **Feature Request**: Una nueva funcionalidad que te gustaría ver
- 📝 **Documentación**: Mejoras o correcciones a la documentación
- ❓ **Pregunta**: Dudas sobre cómo usar o implementar algo

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**¿Necesitas ayuda?** Revisa la documentación en `client/README.md` o abre un [issue](https://github.com/tu-usuario/control-stock/issues).

