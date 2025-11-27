import { useState, useEffect } from 'react';
import { useMovements } from '@/hooks/useMovements';
import { MovementList } from '@/components/movements/MovementList';
import { MovementForm } from '@/components/movements/MovementForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialSummary } from '@/lib/analytics';
import type { FinancialSummary } from '@/lib/analytics';
import type { Movement } from '@/types/movement';
import { formatCurrency } from '@/lib/utils/cn';

export function Movements() {
  const { movements, loading, registrarVenta, registrarProduccion, registrarAjuste, updateMovement, deleteMovement, refresh } = useMovements();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      const data = await getFinancialSummary();
      setSummary(data);
    }
    if (movements.length > 0) {
      loadSummary();
    }
  }, [movements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando movimientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Movimientos</h2>
          <p className="text-muted-foreground">
            Historial de ventas, producciones y ajustes
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          Registrar Movimiento
        </Button>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos por Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalSales} ventas realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costos de Producción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalCosts)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalProductions} producciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ingresos - Costos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                summary.profitMargin >= 30 ? 'text-green-600' : 
                summary.profitMargin >= 15 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {summary.profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rentabilidad general
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementList 
            movements={movements} 
            showProduct={true}
            onEdit={(movement) => {
              setEditingMovement(movement);
              setIsEditFormOpen(true);
            }}
            onDelete={async (id) => {
              await deleteMovement(id);
              await refresh();
            }}
          />
        </CardContent>
      </Card>

      {/* Movement Form - Create */}
      <MovementForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitVenta={async (data) => {
          await registrarVenta(data);
          await refresh();
        }}
        onSubmitProduccion={async (data) => {
          await registrarProduccion(data);
          await refresh();
        }}
        onSubmitAjuste={async (data) => {
          await registrarAjuste(data);
          await refresh();
        }}
      />

      {/* Movement Form - Edit */}
      <MovementForm
        open={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingMovement(null);
        }}
        onSubmitVenta={async () => {}}
        onSubmitProduccion={async () => {}}
        onSubmitAjuste={async () => {}}
        initialMovement={editingMovement || undefined}
        onUpdate={async (id, data) => {
          await updateMovement(id, data);
          await refresh();
        }}
        title="Editar Movimiento"
      />
    </div>
  );
}

