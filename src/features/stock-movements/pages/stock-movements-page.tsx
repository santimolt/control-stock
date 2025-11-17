import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { StockMovementDialog } from '../components/stock-movement-dialog'

type StockMovement = {
  id: string
  product_id: string
  type: 'entry' | 'exit'
  quantity: number
  reason: string | null
  notes: string | null
  created_at: string
  product?: {
    name: string
  }
}

async function fetchStockMovements(userId: string) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      product:products(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as StockMovement[]
}

export function StockMovementsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements', user?.id],
    queryFn: () => fetchStockMovements(user!.id),
    enabled: !!user,
  })

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimientos de Stock</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Registra entradas y salidas de productos
          </p>
        </div>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {movements?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No hay movimientos</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4">
              Comienza registrando tu primer movimiento de stock
            </p>
            <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Movimiento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {movements?.map((movement) => (
            <Card key={movement.id}>
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {movement.type === 'entry' ? (
                      <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">
                          {movement.type === 'entry' ? 'Entrada' : 'Salida'}
                        </h3>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                          • {movement.product?.name || 'Producto eliminado'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm">
                          <span className="font-medium">Cantidad:</span>{' '}
                          {movement.quantity}
                        </p>
                        {movement.reason && (
                          <p className="text-xs sm:text-sm">
                            <span className="font-medium">Motivo:</span>{' '}
                            {movement.reason}
                          </p>
                        )}
                        {movement.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {movement.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right ml-11 sm:ml-0 flex-shrink-0">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StockMovementDialog
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </div>
  )
}

