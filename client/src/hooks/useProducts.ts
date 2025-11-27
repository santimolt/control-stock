import { useState, useEffect, useCallback } from 'react';
import type { Product, CreateProductInput } from '@/types/product';
import * as db from '@/lib/db';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (data: CreateProductInput) => Promise<Product>;
  updateProduct: (id: string, data: Partial<CreateProductInput>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  searchProducts: (query: string) => Promise<Product[]>;
  refresh: () => Promise<void>;
}

/**
 * Main hook for managing products
 * Provides CRUD operations and state management for products
 */
export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.getAllProducts();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading products';
      setError(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = useCallback(async (data: CreateProductInput): Promise<Product> => {
    try {
      setError(null);
      const newProduct = await db.createProduct(data);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating product';
      setError(errorMessage);
      console.error('Error creating product:', err);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (
    id: string, 
    data: Partial<CreateProductInput>
  ): Promise<Product> => {
    try {
      setError(null);
      const updated = await db.updateProduct(id, data);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating product';
      setError(errorMessage);
      console.error('Error updating product:', err);
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await db.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting product';
      setError(errorMessage);
      console.error('Error deleting product:', err);
      throw err;
    }
  }, []);

  const getProduct = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    try {
      setError(null);
      return await db.searchProducts(query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error searching products';
      setError(errorMessage);
      console.error('Error searching products:', err);
      return [];
    }
  }, []);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    searchProducts,
    refresh: loadProducts,
  };
}

