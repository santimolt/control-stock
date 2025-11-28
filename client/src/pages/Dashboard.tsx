import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import * as db from '@/lib/db';
import type { Product } from '@/types/product';
import { getFinancialSummary, getTotalInventoryValue } from '@/lib/analytics';
import type { FinancialSummary } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils/cn';
import { countOutOfStock, getStockStatusColor } from '@/lib/utils/stock-checks';
import {
  exportDatabase,
  downloadBackupFile,
  readBackupFile,
  importDatabase,
} from '@/lib/db/backup';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    categories: 0,
    inventoryValue: 0,
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const products = await db.getAllProducts();
        const categories = await db.getAllCategories();
        const inventoryValue = await getTotalInventoryValue();
        const financial = await getFinancialSummary();
        
        setStats({
          totalProducts: products.length,
          outOfStock: countOutOfStock(products),
          categories: categories.length,
          inventoryValue,
        });
        
        setFinancialSummary(financial);

        // Get 5 most recently updated products
        const recent = [...products]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
        setRecentProducts(recent);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleExportClick() {
    try {
      setExporting(true);
      const backup = await exportDatabase();
      downloadBackupFile(backup);
      alert('Backup exportado correctamente.');
    } catch (error) {
      console.error('Error exporting backup:', error);
      const message =
        error instanceof Error ? error.message : 'Ocurrió un error al exportar el backup.';
      alert(message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'Esta acción reemplazará TODOS los productos, movimientos y fotos actuales por los del archivo seleccionado. ¿Quieres continuar?',
    );

    if (!confirmed) {
      event.target.value = '';
      return;
    }

    try {
      setImporting(true);
      const backup = await readBackupFile(file);
      await importDatabase(backup);
      alert('Datos importados correctamente. La página se recargará para aplicar los cambios.');
      window.location.reload();
    } catch (error) {
      console.error('Error importing backup:', error);
      const message =
        error instanceof Error ? error.message : 'Ocurrió un error al importar el backup.';
      alert(message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Vista general de tu inventario
        </p>
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Productos"
          value={stats.totalProducts}
          description="Productos en inventario"
        />
        <StatsCard
          title="Sin Stock"
          value={stats.outOfStock}
          description="Productos agotados"
        />
        <StatsCard
          title="Valor Inventario"
          value={formatCurrency(stats.inventoryValue)}
          description="Basado en costo promedio"
        />
      </div>

      {/* Financial Stats */}
      {financialSummary && financialSummary.totalSales > 0 && (
        <>
          <div>
            <h3 className="text-xl font-semibold mb-4">Métricas Financieras</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Ingresos Totales"
              value={formatCurrency(financialSummary.totalRevenue)}
              description={`${financialSummary.totalSales} ventas`}
            />
            <StatsCard
              title="Costos Totales"
              value={formatCurrency(financialSummary.totalCosts)}
              description={`${financialSummary.totalProductions} producciones`}
            />
            <StatsCard
              title="Ganancia Neta"
              value={formatCurrency(financialSummary.netProfit)}
              description="Ingresos - Costos"
            />
            <StatsCard
              title="Margen Promedio"
              value={`${financialSummary.profitMargin.toFixed(1)}%`}
              description="Rentabilidad general"
            />
          </div>
        </>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Productos Recientes</h3>
          <Link to="/products">
            <Button variant="outline">Ver Todos</Button>
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No hay productos todavía</p>
            <Link to="/products">
              <Button className="mt-4">Agregar Primer Producto</Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getStockStatusColor(product.quantity)}`}>
                    {product.quantity} unidades
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Data management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Configuración de datos</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleExportClick} disabled={exporting || importing}>
            {exporting ? 'Exportando...' : 'Exportar datos'}
          </Button>
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={exporting || importing}
          >
            {importing ? 'Importando...' : 'Importar datos'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFileChange}
          />
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Puedes exportar una copia de seguridad completa de tus productos, movimientos y fotos,
          e importarla en otra instalación de la app. Al importar, los datos actuales se
          reemplazarán por los del archivo seleccionado.
        </p>
      </div>
    </div>
  );
}

