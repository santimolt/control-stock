import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

async function fetchDashboardStats(userId: string) {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)

  if (productsError) throw productsError

  const totalProducts = products?.length || 0
  const totalStock = products?.reduce((sum, p) => sum + p.current_stock, 0) || 0
  const lowStockProducts = products?.filter((p) => p.current_stock <= p.min_stock).length || 0

  const { data: movements, error: movementsError } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (movementsError) throw movementsError

  return {
    totalProducts,
    totalStock,
    lowStockProducts,
    recentMovements: movements || [],
  }
}

export function DashboardPage() {
  const { user } = useAuthStore()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => fetchDashboardStats(user!.id),
    enabled: !!user,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Resumen general de tu inventario
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unidades en inventario
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Movimientos Recientes</CardTitle>
          <CardDescription className="text-sm">
            Últimos 10 movimientos de stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentMovements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay movimientos recientes
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {stats?.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {movement.type === 'entry' ? (
                      <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        {movement.type === 'entry' ? 'Entrada' : 'Salida'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Cantidad: {movement.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right ml-11 sm:ml-0">
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(movement.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

