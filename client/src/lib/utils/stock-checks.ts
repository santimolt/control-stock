import type { Product } from '@/types/product';

/**
 * Umbral por defecto para considerar stock bajo
 */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Verifica si un producto está sin stock (cantidad === 0)
 */
export function isOutOfStock(quantity: number): boolean {
  return quantity === 0;
}

/**
 * Verifica si un producto tiene stock bajo (cantidad > 0 y < threshold)
 */
export function isLowStock(quantity: number, threshold: number = DEFAULT_LOW_STOCK_THRESHOLD): boolean {
  return quantity > 0 && quantity < threshold;
}

/**
 * Verifica si un producto tiene stock suficiente (cantidad >= threshold)
 */
export function hasEnoughStock(quantity: number, threshold: number = DEFAULT_LOW_STOCK_THRESHOLD): boolean {
  return quantity >= threshold;
}

/**
 * Obtiene el estado del stock como string
 * @returns 'out-of-stock' | 'low-stock' | 'in-stock'
 */
export function getStockStatus(
  quantity: number,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): 'out-of-stock' | 'low-stock' | 'in-stock' {
  if (isOutOfStock(quantity)) {
    return 'out-of-stock';
  }
  if (isLowStock(quantity, threshold)) {
    return 'low-stock';
  }
  return 'in-stock';
}

/**
 * Obtiene la etiqueta legible del estado del stock
 * @returns 'Sin Stock' | 'Stock Bajo' | 'En Stock'
 */
export function getStockStatusLabel(
  quantity: number,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): string {
  const status = getStockStatus(quantity, threshold);
  switch (status) {
    case 'out-of-stock':
      return 'Sin Stock';
    case 'low-stock':
      return 'Stock Bajo';
    case 'in-stock':
      return 'En Stock';
  }
}

/**
 * Obtiene las clases CSS para el color según el estado del stock
 * @returns Clases de Tailwind CSS para el color
 */
export function getStockStatusColor(
  quantity: number,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): string {
  const status = getStockStatus(quantity, threshold);
  switch (status) {
    case 'out-of-stock':
      return 'text-destructive';
    case 'low-stock':
      return 'text-yellow-600';
    case 'in-stock':
      return 'text-green-600';
  }
}

/**
 * Filtra productos que están sin stock
 */
export function filterOutOfStock(products: Product[]): Product[] {
  return products.filter(p => isOutOfStock(p.quantity));
}

/**
 * Filtra productos que tienen stock bajo
 */
export function filterLowStock(
  products: Product[],
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): Product[] {
  return products.filter(p => isLowStock(p.quantity, threshold));
}

/**
 * Filtra productos que tienen stock suficiente
 */
export function filterInStock(
  products: Product[],
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): Product[] {
  return products.filter(p => hasEnoughStock(p.quantity, threshold));
}

/**
 * Cuenta cuántos productos están sin stock
 */
export function countOutOfStock(products: Product[]): number {
  return filterOutOfStock(products).length;
}

/**
 * Cuenta cuántos productos tienen stock bajo
 */
export function countLowStock(
  products: Product[],
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): number {
  return filterLowStock(products, threshold).length;
}

