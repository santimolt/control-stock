# Configuración de Supabase

Esta guía te ayudará a configurar Supabase para la aplicación de Control de Stock.

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y la clave anónima (anon key)

## 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 3. Crear tablas en Supabase

Ejecuta los siguientes SQL en el SQL Editor de Supabase:

### Tabla `categories`

Esta tabla almacena las categorías de productos:

```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para mejorar las consultas
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### Tabla `user_profiles`

Esta tabla almacena los usernames de los usuarios (ya que Supabase Auth requiere email internamente). El `id` referencia directamente a `auth.users(id)`:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar las consultas
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

**Nota importante:** En esta estructura, `id` es la clave primaria que referencia directamente a `auth.users(id)`, no hay una columna `user_id` separada.

### Tabla `products`

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para mejorar las consultas
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
```

### Tabla `stock_movements`

```sql
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Índices para mejorar las consultas
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
```

## 4. Configurar Row Level Security (RLS)

Habilita RLS en todas las tablas y crea las políticas:

### Habilitar RLS

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
```

### Políticas para `categories`

```sql
-- Permitir SELECT solo para el usuario autenticado en sus propias categorías
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir INSERT solo para el usuario autenticado
CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir UPDATE solo para el usuario autenticado en sus propias categorías
CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE solo para el usuario autenticado en sus propias categorías
CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para `user_profiles`

```sql
-- Permitir SELECT para el usuario autenticado en su propio perfil
-- Y para admins ver todos los perfiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Permitir INSERT solo para admins (para crear nuevos usuarios)
CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Permitir UPDATE para el usuario autenticado en su propio perfil
-- Y para admins actualizar cualquier perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Permitir DELETE solo para el usuario autenticado en su propio perfil
-- Y para admins eliminar cualquier perfil
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

**Nota importante:** Las políticas usan `id` en lugar de `user_id` porque `user_profiles.id` referencia directamente a `auth.users(id)`.

### Políticas para `products`

```sql
-- Permitir SELECT solo para el usuario autenticado en sus propios productos
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir INSERT solo para el usuario autenticado
CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir UPDATE solo para el usuario autenticado en sus propios productos
CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE solo para el usuario autenticado en sus propios productos
CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para `stock_movements`

```sql
-- Permitir SELECT solo para el usuario autenticado en sus propios movimientos
CREATE POLICY "Users can view their own stock movements"
  ON stock_movements FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir INSERT solo para el usuario autenticado
CREATE POLICY "Users can insert their own stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir UPDATE solo para el usuario autenticado en sus propios movimientos
CREATE POLICY "Users can update their own stock movements"
  ON stock_movements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE solo para el usuario autenticado en sus propios movimientos
CREATE POLICY "Users can delete their own stock movements"
  ON stock_movements FOR DELETE
  USING (auth.uid() = user_id);
```

## 5. Función para actualizar `updated_at` automáticamente

Crea una función para actualizar automáticamente el campo `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Nota:** `user_profiles` no tiene `updated_at` en el esquema actual, por lo que no necesita trigger.

## 6. Función para obtener email desde username (opcional)

Si necesitas obtener el email de un usuario desde su username, puedes crear esta función:

```sql
CREATE OR REPLACE FUNCTION get_user_email_by_username(username_param TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT au.email INTO user_email
  FROM auth.users au
  INNER JOIN user_profiles up ON au.id = up.id
  WHERE up.username = username_param;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Nota:** Esta función usa `SECURITY DEFINER` para poder acceder a `auth.users`. Solo úsala si realmente la necesitas.

## 7. Configurar sistema de roles y primer admin

### Agregar columna `role` (si no existe)

Si ya tienes la tabla `user_profiles` creada sin la columna `role`, ejecuta:

```sql
-- Agregar columna role si no existe
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Crear índice para role
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
```

### Actualizar políticas RLS para roles

Si ya tienes políticas creadas con la estructura antigua (usando `user_id`), primero elimínalas y luego crea las nuevas (ver sección 4):

```sql
-- Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Luego ejecuta las políticas nuevas de la sección 4
```

### Configurar el primer admin

Para habilitar el sistema de registro restringido, necesitas configurar al menos un usuario como admin:

1. **Opción 1: Si ya tienes un usuario creado**
   - Reemplaza `'tu_username_admin'` con el username de tu usuario admin
   ```sql
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE username = 'tu_username_admin';
   ```

2. **Opción 2: Crear el primer admin manualmente**
   - Crea un usuario desde la aplicación normalmente (esto solo funcionará si no hay políticas RLS restrictivas aún)
   - Luego actualiza su rol a admin:
   ```sql
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE username = 'tu_username_admin';
   ```

3. **Opción 3: Crear admin directamente en Supabase (temporalmente deshabilitar RLS)**
   - Temporalmente deshabilita RLS para crear el admin:
   ```sql
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   -- Crea el usuario desde la app o manualmente
   -- Luego actualiza el rol
   UPDATE user_profiles SET role = 'admin' WHERE username = 'tu_username_admin';
   -- Vuelve a habilitar RLS
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ```

**Importante:** Una vez configurado el primer admin, solo los usuarios con `role = 'admin'` podrán crear nuevos usuarios desde la aplicación.

### Crear Edge Function para crear usuarios

Para que los admins puedan crear usuarios sin necesidad de habilitar el registro público, necesitas crear una Edge Function desde el Dashboard. Sigue las instrucciones completas en [EDGE_FUNCTION_SETUP.md](./EDGE_FUNCTION_SETUP.md).

**Resumen rápido:**
1. Ve a tu Dashboard de Supabase → **Edge Functions**
2. Haz clic en **"Create a new function"**
3. Nombre: `create-user`
4. Copia y pega el código de `EDGE_FUNCTION_SETUP.md`
5. Haz clic en **"Deploy"**

Una vez creada, puedes deshabilitar el registro público en Supabase:
- Authentication → Settings → Desactiva "Enable email signup"

## 8. Configurar sistema de desactivación de usuarios

### Agregar columna `active` a `user_profiles`

Para habilitar el sistema de desactivación de usuarios (en lugar de eliminación permanente), ejecuta:

```sql
-- Agregar columna active (por defecto true para usuarios existentes)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true NOT NULL;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(active);
```

### Actualizar políticas RLS para usuarios activos

**IMPORTANTE:** Para evitar recursión infinita, primero necesitamos crear una función helper que pueda leer `user_profiles` sin estar sujeta a RLS:

```sql
-- Función helper para verificar si el usuario actual es admin activo
-- Usa SECURITY DEFINER para evitar recursión en políticas RLS
CREATE OR REPLACE FUNCTION is_admin_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Ahora crea las políticas (primero elimina las antiguas):

```sql
-- Eliminar políticas antiguas de user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view active profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

-- SELECT: Usuarios pueden ver su propio perfil si están activos
-- Admins pueden ver todos los perfiles (activos e inactivos) para gestión
CREATE POLICY "Users can view active profiles"
  ON user_profiles FOR SELECT
  USING (
    (auth.uid() = id AND active = true)
    OR is_admin_active()
  );

-- INSERT: Solo admins activos pueden crear usuarios, siempre como activos
CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (is_admin_active());

-- UPDATE: Usuarios pueden actualizar su propio perfil si están activos
-- Admins activos pueden actualizar cualquier perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    (auth.uid() = id AND active = true)
    OR is_admin_active()
  )
  WITH CHECK (
    (auth.uid() = id AND active = true)
    OR is_admin_active()
  );

-- DELETE: Solo admins pueden eliminar perfiles (mantener por si se necesita eliminación real)
CREATE POLICY "Admins can delete user profiles"
  ON user_profiles FOR DELETE
  USING (is_admin_active());
```

### Crear función helper para verificar usuario activo

Para evitar recursión en las políticas de otras tablas, crea otra función helper:

```sql
-- Función helper para verificar si el usuario actual está activo
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Actualizar políticas RLS para otras tablas

Las políticas de `products`, `stock_movements`, y `categories` deben verificar que el usuario esté activo:

```sql
-- Ejemplo para products (aplicar mismo patrón a stock_movements y categories)
DROP POLICY IF EXISTS "Users can view their own products" ON products;
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id AND is_user_active());

DROP POLICY IF EXISTS "Users can insert their own products" ON products;
CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_user_active());

DROP POLICY IF EXISTS "Users can update their own products" ON products;
CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id AND is_user_active())
  WITH CHECK (auth.uid() = user_id AND is_user_active());

DROP POLICY IF EXISTS "Users can delete their own products" ON products;
CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id AND is_user_active());
```

**Repite el mismo patrón para `stock_movements` y `categories`.**

### Funcionalidad de desactivación

- **Desactivar**: Cambiar `active = false` - el usuario no podrá iniciar sesión ni realizar operaciones
- **Reactivar**: Cambiar `active = true` - el usuario puede volver a usar el sistema
- Los datos del usuario se mantienen intactos (productos, movimientos, etc.)
- Solo admins pueden desactivar/reactivar usuarios
- Un admin no puede desactivarse a sí mismo
- No se puede desactivar el último admin activo

## 9. Migración desde estructura antigua (si aplica)

Si tienes una base de datos con la estructura antigua donde `user_profiles` tenía `user_id` separado, necesitas migrar:

```sql
-- 1. Crear nueva tabla temporal con la estructura correcta
CREATE TABLE user_profiles_new (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrar datos (asumiendo que user_id en la tabla antigua corresponde a id en auth.users)
INSERT INTO user_profiles_new (id, username, role, created_at)
SELECT user_id, username, COALESCE(role, 'user'), created_at
FROM user_profiles;

-- 3. Eliminar tabla antigua
DROP TABLE user_profiles;

-- 4. Renombrar tabla nueva
ALTER TABLE user_profiles_new RENAME TO user_profiles;

-- 5. Recrear índices
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- 6. Recrear políticas RLS (ver sección 4)
```

## 10. Verificar configuración

1. Asegúrate de que las tablas estén creadas
2. Verifica que RLS esté habilitado
3. Verifica que las políticas estén creadas
4. Configura al menos un usuario como admin
5. Agrega la columna `active` a `user_profiles` (sección 8)
6. Actualiza las políticas RLS para filtrar usuarios activos (sección 8)
7. Inicia sesión con el usuario admin
8. Verifica que puedas acceder a la sección "Usuarios" en el menú
9. Prueba crear un nuevo usuario desde `/users/register`
10. Prueba desactivar y reactivar un usuario desde la página de gestión
11. Verifica que usuarios desactivados no puedan iniciar sesión
12. Verifica que usuarios no-admin no puedan acceder a la página de registro
13. Prueba crear categorías y productos con categorías

## Notas importantes

- **Autenticación con Username**: La aplicación usa username en lugar de email para el login. Internamente, Supabase requiere email, por lo que se genera automáticamente como `username@example.com`. El username real se almacena en la tabla `user_profiles`.
- **Estructura de user_profiles**: El `id` en `user_profiles` es la clave primaria que referencia directamente a `auth.users(id)`, no hay una columna `user_id` separada.
- **Categorías**: Los productos ahora pueden tener una categoría asociada mediante `category_id`. Las categorías son específicas por usuario.
- **Imágenes**: Los productos pueden tener una ruta de imagen almacenada en `image_path`.
- **Seguridad**: RLS asegura que cada usuario solo pueda ver y modificar sus propios datos, excepto los admins que pueden crear nuevos usuarios
- **Roles**: Solo usuarios con `role = 'admin'` pueden crear nuevos usuarios. Los nuevos usuarios se crean con `role = 'user'` por defecto
- **Desactivación de usuarios**: Los usuarios pueden ser desactivados en lugar de eliminados. Los usuarios desactivados no pueden iniciar sesión ni realizar operaciones, pero sus datos se mantienen intactos. Solo admins pueden desactivar/reactivar usuarios.
- **Seguridad de desactivación**: Un admin no puede desactivarse a sí mismo, y no se puede desactivar el último admin activo del sistema.
- **Escalabilidad**: Esta configuración está optimizada para un solo usuario por cuenta, pero puede escalarse fácilmente
- **Username único**: Los usernames deben ser únicos y solo pueden contener letras minúsculas, números y guiones bajos (3-20 caracteres)
