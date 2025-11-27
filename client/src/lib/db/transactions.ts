import { getProductById, updateProduct } from './index';
import { createMovement } from './movements';
import type { Product } from '@/types/product';
import type { Movement } from '@/types/movement';

/**
 * Registrar una venta
 * - Reduce el stock del producto
 * - Crea un movimiento de tipo 'sale'
 * - Usa el averageCost actual del producto
 */
export async function registrarVenta(input: {
  productId: string;
  quantity: number;
  unitPrice?: number;  // Usa product.price si no se especifica
  notes?: string;
}): Promise<{ product: Product; movement: Movement }> {
  
  // 1. Obtener producto
  const product = await getProductById(input.productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }
  
  // 2. Validar stock suficiente
  if (product.quantity < input.quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${product.quantity}, solicitado: ${input.quantity}`);
  }
  
  // 3. Validar cantidad positiva
  if (input.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  
  // 4. Calcular precio unitario
  const unitPrice = input.unitPrice ?? product.price;
  if (unitPrice <= 0) {
    throw new Error('El precio de venta debe ser mayor a 0');
  }
  
  // 5. Crear movimiento
  const movement = await createMovement({
    productId: product.id,
    type: 'sale',
    quantity: -input.quantity,  // Negativo porque es salida
    unitPrice: unitPrice,
    totalAmount: input.quantity * unitPrice,
    averageCostAtTime: product.averageCost,
    notes: input.notes,
    productSnapshot: {
      name: product.name,
      category: product.category
    }
  });
  
  // 6. Actualizar producto (reducir stock)
  const updatedProduct = await updateProduct(product.id, {
    quantity: product.quantity - input.quantity
  });
  
  return { product: updatedProduct, movement };
}

/**
 * Registrar una producción
 * - Aumenta el stock del producto
 * - Actualiza el costo promedio ponderado
 * - Crea un movimiento de tipo 'production'
 */
export async function registrarProduccion(input: {
  productId: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}): Promise<{ product: Product; movement: Movement }> {
  
  // 1. Obtener producto
  const product = await getProductById(input.productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }
  
  // 2. Validar cantidad y costo
  if (input.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  if (input.unitCost < 0) {
    throw new Error('El costo no puede ser negativo');
  }
  
  // 3. Calcular nuevo costo promedio ponderado
  const stockActual = product.quantity;
  const costoActual = product.averageCost;
  const cantidadNueva = input.quantity;
  const costoNuevo = input.unitCost;
  
  let nuevoCostoPromedio: number;
  
  if (stockActual === 0) {
    // Si no hay stock, el nuevo costo es el de esta producción
    nuevoCostoPromedio = costoNuevo;
  } else {
    // Cálculo del promedio ponderado
    const costoTotalActual = stockActual * costoActual;
    const costoTotalNuevo = cantidadNueva * costoNuevo;
    nuevoCostoPromedio = (costoTotalActual + costoTotalNuevo) / (stockActual + cantidadNueva);
  }
  
  // 4. Crear movimiento
  const movement = await createMovement({
    productId: product.id,
    type: 'production',
    quantity: input.quantity,  // Positivo porque es entrada
    unitCost: input.unitCost,
    totalAmount: input.quantity * input.unitCost,
    averageCostAtTime: nuevoCostoPromedio,  // El NUEVO promedio
    notes: input.notes,
    productSnapshot: {
      name: product.name,
      category: product.category
    }
  });
  
  // 5. Actualizar producto (aumentar stock y actualizar costo)
  const updatedProduct = await updateProduct(product.id, {
    quantity: product.quantity + input.quantity,
    averageCost: nuevoCostoPromedio
  });
  
  return { product: updatedProduct, movement };
}

/**
 * Registrar un ajuste de inventario
 * - Ajusta el stock del producto (+ o -)
 * - NO actualiza el costo promedio
 * - Crea un movimiento de tipo 'adjustment'
 */
export async function registrarAjuste(input: {
  productId: string;
  quantity: number;  // Puede ser positivo o negativo
  notes?: string;
}): Promise<{ product: Product; movement: Movement }> {
  
  // 1. Obtener producto
  const product = await getProductById(input.productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }
  
  // 2. Validar que la cantidad no sea 0
  if (input.quantity === 0) {
    throw new Error('El ajuste no puede ser de 0 unidades');
  }
  
  // 3. Validar que no deje stock negativo
  const nuevoStock = product.quantity + input.quantity;
  if (nuevoStock < 0) {
    throw new Error(`El ajuste dejaría stock negativo. Stock actual: ${product.quantity}`);
  }
  
  // 4. Crear movimiento
  const movement = await createMovement({
    productId: product.id,
    type: 'adjustment',
    quantity: input.quantity,
    totalAmount: 0,  // Los ajustes no tienen valor monetario directo
    averageCostAtTime: product.averageCost,
    notes: input.notes,
    productSnapshot: {
      name: product.name,
      category: product.category
    }
  });
  
  // 5. Actualizar producto (ajustar stock, NO cambiar costo)
  const updatedProduct = await updateProduct(product.id, {
    quantity: nuevoStock
  });
  
  return { product: updatedProduct, movement };
}

