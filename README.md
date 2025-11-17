# Control de Stock

Aplicación web simple para control de stock de un emprendimiento pequeño. Diseñada para un solo usuario, pero siguiendo buenas prácticas y usando tecnologías modernas.

## 🚀 Stack Tecnológico

- **React 18** + **Vite** + **TypeScript** - Framework y herramientas
- **ShadCN UI** - Componentes UI modernos y accesibles
- **TailwindCSS** - Estilos utility-first
- **React Router** - Navegación y rutas protegidas
- **TanStack Query** - Manejo de datos, cache y sincronización
- **Zustand** - Estado global ligero
- **Supabase** - Autenticación, base de datos PostgreSQL y storage
- **React Hook Form** + **Zod** - Formularios y validación
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install
```

## 🔧 Configuración

### 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

Puedes encontrar estas credenciales en tu proyecto de Supabase:
- Dashboard de Supabase → Settings → API

### 2. Configurar Supabase

Sigue la guía completa en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para:
- Crear las tablas necesarias
- Configurar Row Level Security (RLS)
- Establecer las políticas de seguridad

**Resumen rápido:**
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta los scripts SQL del archivo `SUPABASE_SETUP.md` en el SQL Editor
3. Configura las variables de entorno

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Build

```bash
# Compilar para producción
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes UI reutilizables (ShadCN)
│   └── ui/
├── features/           # Features organizadas por dominio
│   ├── auth/           # Autenticación (login, registro)
│   ├── dashboard/      # Dashboard principal
│   ├── products/       # Gestión de productos
│   └── stock-movements/ # Movimientos de stock
├── lib/                # Utilidades y configuraciones
│   ├── supabase.ts     # Cliente de Supabase
│   └── utils.ts        # Utilidades generales
├── store/              # Estado global (Zustand)
│   └── auth-store.ts   # Store de autenticación
├── App.tsx             # Componente principal y rutas
└── main.tsx            # Punto de entrada
```

## 🎯 Funcionalidades

### Autenticación
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Protección de rutas
- ✅ Cierre de sesión

### Productos
- ✅ Listado de productos
- ✅ Crear nuevo producto
- ✅ Editar producto existente
- ✅ Eliminar producto
- ✅ Visualización de stock actual y mínimo
- ✅ Alertas de stock bajo

### Movimientos de Stock
- ✅ Registrar entradas de stock
- ✅ Registrar salidas de stock
- ✅ Historial de movimientos
- ✅ Actualización automática de stock
- ✅ Validación de stock disponible

### Dashboard
- ✅ Resumen de productos totales
- ✅ Stock total en inventario
- ✅ Productos con stock bajo
- ✅ Movimientos recientes

## 🚀 Deploy en GitHub Pages

El proyecto está configurado para deploy automático en GitHub Pages.

### Configuración inicial:

1. **Configurar GitHub Secrets:**
   - Ve a Settings → Secrets and variables → Actions
   - Agrega los siguientes secrets:
     - `VITE_SUPABASE_URL`: Tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

2. **Habilitar GitHub Pages:**
   - Ve a Settings → Pages
   - Source: GitHub Actions
   - El workflow se ejecutará automáticamente en cada push a `main`

3. **Actualizar base path (opcional):**
   - Si tu repositorio tiene otro nombre, actualiza `base` en `vite.config.ts`
   - Actualmente está configurado para `/control-stock/`

### Deploy manual:

```bash
npm run build
# Subir la carpeta dist/ a GitHub Pages
```

## 📝 Notas

- La aplicación está diseñada para un solo usuario por cuenta
- Cada usuario solo puede ver y modificar sus propios datos (gracias a RLS)
- El stock se actualiza automáticamente al registrar movimientos
- Los movimientos de salida validan que haya stock suficiente

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## 📄 Licencia

Este proyecto es de uso personal/emprendimiento.

