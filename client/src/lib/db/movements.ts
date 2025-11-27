import { getDB } from './index';
import type { Movement, MovementFilters } from '@/types/movement';
import { generateUUID } from '@/lib/utils/cn';

// ============================================================================
// CRUD Operations for Movements
// ============================================================================

/**
 * Get all movements from the database
 */
export async function getAllMovements(): Promise<Movement[]> {
  const db = await getDB();
  return db.getAll('movements');
}

/**
 * Get a single movement by ID
 */
export async function getMovementById(id: string): Promise<Movement | undefined> {
  const db = await getDB();
  return db.get('movements', id);
}

/**
 * Create a new movement (internal use, prefer using transaction functions)
 */
export async function createMovement(data: Omit<Movement, 'id' | 'createdAt'>): Promise<Movement> {
  const db = await getDB();
  const movement: Movement = {
    ...data,
    id: generateUUID(),
    createdAt: new Date(),
  };
  await db.add('movements', movement);
  return movement;
}

/**
 * Update a movement by ID
 * WARNING: This should be used carefully as it doesn't update product stock
 */
export async function updateMovement(id: string, data: Partial<Omit<Movement, 'id' | 'createdAt' | 'productSnapshot'>>): Promise<Movement> {
  const db = await getDB();
  const existing = await db.get('movements', id);
  if (!existing) {
    throw new Error(`Movement with id ${id} not found`);
  }
  
  const updated: Movement = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    productSnapshot: existing.productSnapshot,
  };
  
  // Recalculate totalAmount if needed
  // Use absolute value for quantity to ensure totalAmount is always positive
  if (updated.type === 'sale' && updated.unitPrice !== undefined && updated.quantity !== undefined) {
    updated.totalAmount = updated.unitPrice * Math.abs(updated.quantity);
  } else if (updated.type === 'production' && updated.unitCost !== undefined && updated.quantity !== undefined) {
    updated.totalAmount = updated.unitCost * Math.abs(updated.quantity);
  } else if (updated.type === 'adjustment') {
    updated.totalAmount = 0;
  }
  
  await db.put('movements', updated);
  return updated;
}

/**
 * Delete a movement by ID
 * WARNING: This should be used carefully as it doesn't update product stock
 */
export async function deleteMovement(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('movements', id);
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get all movements for a specific product
 */
export async function getMovementsByProduct(productId: string): Promise<Movement[]> {
  const db = await getDB();
  return db.getAllFromIndex('movements', 'by-product', productId);
}

/**
 * Get all movements of a specific type
 */
export async function getMovementsByType(type: string): Promise<Movement[]> {
  const db = await getDB();
  return db.getAllFromIndex('movements', 'by-type', type);
}

/**
 * Get movements within a date range
 */
export async function getMovementsByDateRange(startDate: Date, endDate: Date): Promise<Movement[]> {
  const db = await getDB();
  const allMovements = await db.getAll('movements');
  
  return allMovements.filter(movement => {
    const movementDate = new Date(movement.createdAt);
    return movementDate >= startDate && movementDate <= endDate;
  });
}

/**
 * Get movements with complex filters
 */
export async function getMovementsWithFilters(filters: MovementFilters): Promise<Movement[]> {
  const db = await getDB();
  let movements = await db.getAll('movements');
  
  // Filter by product
  if (filters.productId) {
    movements = movements.filter(m => m.productId === filters.productId);
  }
  
  // Filter by type
  if (filters.type) {
    movements = movements.filter(m => m.type === filters.type);
  }
  
  // Filter by date range
  if (filters.startDate || filters.endDate) {
    movements = movements.filter(m => {
      const movementDate = new Date(m.createdAt);
      if (filters.startDate && movementDate < filters.startDate) return false;
      if (filters.endDate && movementDate > filters.endDate) return false;
      return true;
    });
  }
  
  // Sort by date descending (newest first)
  movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return movements;
}

/**
 * Get movements count
 */
export async function getMovementsCount(): Promise<number> {
  const db = await getDB();
  return db.count('movements');
}

/**
 * Get recent movements (last N)
 */
export async function getRecentMovements(limit: number = 10): Promise<Movement[]> {
  const db = await getDB();
  const allMovements = await db.getAll('movements');
  
  return allMovements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

