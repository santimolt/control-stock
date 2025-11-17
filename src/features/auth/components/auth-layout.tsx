import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Control de Stock</h1>
          <p className="text-muted-foreground mt-2">Gestiona tu inventario de forma simple</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

