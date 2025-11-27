import { useState, useEffect, useCallback } from 'react';
import type { Movement, MovementFilters } from '@/types/movement';
import * as movements from '@/lib/db/movements';
import * as transactions from '@/lib/db/transactions';
import type { Product } from '@/types/product';

interface UseMovementsReturn {
  movements: Movement[];
  loading: boolean;
  error: string | null;
  registrarVenta: (input: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }) => Promise<{ product: Product; movement: Movement }>;
  registrarProduccion: (input: {
    productId: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  }) => Promise<{ product: Product; movement: Movement }>;
  registrarAjuste: (input: {
    productId: string;
    quantity: number;
    notes?: string;
  }) => Promise<{ product: Product; movement: Movement }>;
  updateMovement: (id: string, data: Partial<Omit<Movement, 'id' | 'createdAt' | 'productSnapshot'>>) => Promise<Movement>;
  deleteMovement: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  filterMovements: (filters: MovementFilters) => Promise<Movement[]>;
}

/**
 * Main hook for managing movements
 * Provides operations for sales, production, adjustments
 */
export function useMovements(initialFilters?: MovementFilters): UseMovementsReturn {
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Movement[];
      if (initialFilters) {
        data = await movements.getMovementsWithFilters(initialFilters);
      } else {
        data = await movements.getAllMovements();
        // Sort by date descending (newest first)
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      setAllMovements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading movements';
      setError(errorMessage);
      console.error('Error loading movements:', err);
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  // Load movements on mount
  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const registrarVenta = useCallback(async (input: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }) => {
    try {
      setError(null);
      const result = await transactions.registrarVenta(input);
      await loadMovements();  // Reload to show new movement
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error registering sale';
      setError(errorMessage);
      console.error('Error registering sale:', err);
      throw err;
    }
  }, [loadMovements]);

  const registrarProduccion = useCallback(async (input: {
    productId: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  }) => {
    try {
      setError(null);
      const result = await transactions.registrarProduccion(input);
      await loadMovements();  // Reload to show new movement
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error registering production';
      setError(errorMessage);
      console.error('Error registering production:', err);
      throw err;
    }
  }, [loadMovements]);

  const registrarAjuste = useCallback(async (input: {
    productId: string;
    quantity: number;
    notes?: string;
  }) => {
    try {
      setError(null);
      const result = await transactions.registrarAjuste(input);
      await loadMovements();  // Reload to show new movement
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error registering adjustment';
      setError(errorMessage);
      console.error('Error registering adjustment:', err);
      throw err;
    }
  }, [loadMovements]);

  const updateMovement = useCallback(async (
    id: string,
    data: Partial<Omit<Movement, 'id' | 'createdAt' | 'productSnapshot'>>
  ): Promise<Movement> => {
    try {
      setError(null);
      const updated = await movements.updateMovement(id, data);
      setAllMovements(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating movement';
      setError(errorMessage);
      console.error('Error updating movement:', err);
      throw err;
    }
  }, []);

  const deleteMovement = useCallback(async (id: string) => {
    try {
      setError(null);
      await movements.deleteMovement(id);
      setAllMovements(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting movement';
      setError(errorMessage);
      console.error('Error deleting movement:', err);
      throw err;
    }
  }, []);

  const filterMovements = useCallback(async (filters: MovementFilters): Promise<Movement[]> => {
    try {
      setError(null);
      return await movements.getMovementsWithFilters(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error filtering movements';
      setError(errorMessage);
      console.error('Error filtering movements:', err);
      return [];
    }
  }, []);

  return {
    movements: allMovements,
    loading,
    error,
    registrarVenta,
    registrarProduccion,
    registrarAjuste,
    updateMovement,
    deleteMovement,
    refresh: loadMovements,
    filterMovements
  };
}

