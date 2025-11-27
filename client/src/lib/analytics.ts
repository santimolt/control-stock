import { getAllMovements, getMovementsByProduct } from './db/movements';
import { getAllProducts } from './db';
import type { Product } from '@/types/product';

// ============================================================================
// Financial Summary
// ============================================================================

export interface FinancialSummary {
  totalRevenue: number;       // Suma de ventas
  totalCosts: number;         // Suma de costos de producción
  netProfit: number;          // revenue - costs
  profitMargin: number;       // (netProfit / revenue) * 100
  totalSales: number;         // Cantidad de transacciones de venta
  totalProductions: number;   // Cantidad de producciones
  totalAdjustments: number;   // Cantidad de ajustes
}

export async function getFinancialSummary(
  startDate?: Date,
  endDate?: Date
): Promise<FinancialSummary> {
  const allMovements = await getAllMovements();
  const allProducts = await getAllProducts();
  
  // Filtrar por fecha si se especifica
  let movements = allMovements;
  if (startDate || endDate) {
    movements = movements.filter(m => {
      const date = new Date(m.createdAt);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }
  
  // Calcular totales
  const sales = movements.filter(m => m.type === 'sale');
  const productions = movements.filter(m => m.type === 'production');
  const adjustments = movements.filter(m => m.type === 'adjustment');
  
  const totalRevenue = sales.reduce((sum, m) => sum + m.totalAmount, 0);
  
  // Calcular costos de producción:
  // 1. Valor del inventario actual (productos en stock con su costo promedio)
  const inventoryValue = allProducts.reduce((sum, p) => sum + (p.quantity * p.averageCost), 0);
  
  // 2. Costo de productos vendidos (usando el averageCost al momento de la venta)
  const soldProductsCost = sales.reduce((sum, m) => {
    const quantity = Math.abs(m.quantity);
    return sum + (quantity * m.averageCostAtTime);
  }, 0);
  
  // El totalCosts es la suma del inventario actual + costos de productos vendidos
  // Esto incluye tanto costos iniciales como costos de producciones
  const totalCosts = inventoryValue + soldProductsCost;
  
  // Calcular ganancia y margen SOLO sobre las ventas
  // Ganancia de ventas = ingresos de ventas - costo de productos vendidos
  const salesProfit = totalRevenue - soldProductsCost;
  // Margen promedio = (ganancia de ventas / ingresos de ventas) * 100
  const profitMargin = totalRevenue > 0 ? (salesProfit / totalRevenue) * 100 : 0;
  
  // netProfit general (para otros cálculos si se necesita)
  const netProfit = totalRevenue - totalCosts;
  
  // Calcular totalProductions: movimientos de producción + productos con stock sin movimientos
  // Identificar productos que tienen stock pero no tienen movimientos de producción
  const productIdsWithProductions = new Set(productions.map(p => p.productId));
  const productsWithInitialStock = allProducts.filter(
    p => p.quantity > 0 && !productIdsWithProductions.has(p.id)
  );
  // El totalProductions incluye los movimientos registrados + productos con stock inicial
  const totalProductions = productions.length + productsWithInitialStock.length;
  
  return {
    totalRevenue,
    totalCosts,
    netProfit,
    profitMargin,
    totalSales: sales.length,
    totalProductions,
    totalAdjustments: adjustments.length
  };
}

// ============================================================================
// Product Statistics
// ============================================================================

export interface ProductStats {
  productId: string;
  productName: string;
  totalSold: number;          // Cantidad vendida
  revenue: number;            // Ingresos por este producto
  cost: number;               // Costo total (basado en averageCost)
  profit: number;             // Ganancia neta
  avgSalePrice: number;       // Precio promedio de venta
}

export async function getTopSellingProducts(limit: number = 5): Promise<ProductStats[]> {
  const allMovements = await getAllMovements();
  const sales = allMovements.filter(m => m.type === 'sale');
  
  // Agrupar por producto
  const productMap = new Map<string, {
    totalSold: number;
    revenue: number;
    cost: number;
    priceSum: number;
    salesCount: number;
  }>();
  
  for (const sale of sales) {
    const existing = productMap.get(sale.productId) || {
      totalSold: 0,
      revenue: 0,
      cost: 0,
      priceSum: 0,
      salesCount: 0
    };
    
    const quantity = Math.abs(sale.quantity);  // Convertir a positivo
    const unitPrice = sale.unitPrice || 0;
    const unitCost = sale.averageCostAtTime;
    
    existing.totalSold += quantity;
    existing.revenue += sale.totalAmount;
    existing.cost += quantity * unitCost;
    existing.priceSum += unitPrice;
    existing.salesCount += 1;
    
    productMap.set(sale.productId, existing);
  }
  
  // Convertir a array y agregar nombres de productos
  const products = await getAllProducts();
  const productNameMap = new Map(products.map(p => [p.id, p.name]));
  
  const stats: ProductStats[] = [];
  for (const [productId, data] of productMap.entries()) {
    stats.push({
      productId,
      productName: productNameMap.get(productId) || 'Producto eliminado',
      totalSold: data.totalSold,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.revenue - data.cost,
      avgSalePrice: data.salesCount > 0 ? data.priceSum / data.salesCount : 0
    });
  }
  
  // Ordenar por cantidad vendida y limitar
  stats.sort((a, b) => b.totalSold - a.totalSold);
  return stats.slice(0, limit);
}

export async function getProductProfitability(productId: string): Promise<{
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  unitsSold: number;
  unitsProduced: number;
}> {
  const movements = await getMovementsByProduct(productId);
  
  const sales = movements.filter(m => m.type === 'sale');
  const productions = movements.filter(m => m.type === 'production');
  
  const totalRevenue = sales.reduce((sum, m) => sum + m.totalAmount, 0);
  
  // Calcular costo basado en el averageCost al momento de la venta
  const totalCost = sales.reduce((sum, m) => {
    const quantity = Math.abs(m.quantity);
    return sum + (quantity * m.averageCostAtTime);
  }, 0);
  
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  const unitsSold = sales.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  const unitsProduced = productions.reduce((sum, m) => sum + m.quantity, 0);
  
  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    unitsSold,
    unitsProduced
  };
}

// ============================================================================
// Inventory Value
// ============================================================================

export async function getTotalInventoryValue(): Promise<number> {
  const products = await getAllProducts();
  return products.reduce((sum, p) => sum + (p.quantity * p.averageCost), 0);
}

export async function getInventoryByCategory(): Promise<Map<string, {
  quantity: number;
  value: number;
}>> {
  const products = await getAllProducts();
  const categoryMap = new Map<string, { quantity: number; value: number }>();
  
  for (const product of products) {
    const existing = categoryMap.get(product.category) || { quantity: 0, value: 0 };
    existing.quantity += product.quantity;
    existing.value += product.quantity * product.averageCost;
    categoryMap.set(product.category, existing);
  }
  
  return categoryMap;
}

// ============================================================================
// Low Stock / Out of Stock
// ============================================================================

export async function getLowStockProducts(threshold: number = 5): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => p.quantity > 0 && p.quantity < threshold);
}

export async function getOutOfStockProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => p.quantity === 0);
}

