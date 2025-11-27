export interface Product {
  id: string;              // UUID v4
  name: string;
  quantity: number;
  category: string;
  notes?: string;
  
  // Campos financieros
  price: number;           // Precio de venta
  averageCost: number;     // Costo promedio ponderado
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  quantity: number;
  category: string;
  price: number;
  initialCost?: number;    // Costo inicial opcional
  notes?: string;
}

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, 'initialCost'>> {
  id: string;
  averageCost?: number;    // Puede actualizarse manualmente si es necesario
}

// Categorías definidas para el catálogo textil del emprendimiento
export const PRODUCT_CATEGORIES = [
  'Manteles',
  'Mantas',
  'Caminos de mesa',
  'Bolsos',
  'Accesorios textiles'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Helper para calcular margen de ganancia
export function calculateMargin(price: number, cost: number): number {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
}

// Helper para calcular ganancia unitaria
export function calculateProfit(price: number, cost: number): number {
  return price - cost;
}

// Helper para calcular valor del inventario
export function calculateInventoryValue(quantity: number, averageCost: number): number {
  return quantity * averageCost;
}

