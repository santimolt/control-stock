import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { Product } from '@/types/product';
import type { StockDB } from '@/types/database';
import { DB_NAME, DB_VERSION } from '@/types/database';
import { generateUUID } from '@/lib/utils/cn';

let dbInstance: IDBPDatabase<StockDB> | null = null;

/**
 * Initialize the IndexedDB database
 * Creates the object store and indexes if they don't exist
 * Handles migrations between versions
 */
export async function initDB(): Promise<IDBPDatabase<StockDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StockDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);
      
      // Migration v0 -> v1: Create products store
      if (oldVersion < 1) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('by-category', 'category');
        store.createIndex('by-updated', 'updatedAt');
      }
      
      // Migration v1 -> v2: Add price/averageCost to products and create movements store
      if (oldVersion < 2) {
        // Create movements store
        const movementStore = db.createObjectStore('movements', { keyPath: 'id' });
        movementStore.createIndex('by-product', 'productId');
        movementStore.createIndex('by-type', 'type');
        movementStore.createIndex('by-date', 'createdAt');
        
        // Note: Existing products will be migrated on first access
        // They'll get default values of price=0, averageCost=0
        console.log('Database upgraded to v2 - movements store created');
      }
      
      // Migration v2 -> v3: Add photos store
      if (oldVersion < 3) {
        // Create photos store
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('by-product', 'productId');
        photoStore.createIndex('by-created', 'createdAt');
        
        console.log('Database upgraded to v3 - photos store created');
      }
    },
  });

  return dbInstance;
}

/**
 * Get the database instance (initializes if necessary)
 */
export async function getDB(): Promise<IDBPDatabase<StockDB>> {
  if (!dbInstance) await initDB();
  return dbInstance!;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Get all products from the database
 */
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const db = await getDB();
  const product = await db.get('products', id);
  
  // Ensure product has required fields (migration helper)
  if (product) {
    // Type assertion for migration compatibility
    const p = product as any;
    if (!('price' in p)) {
      p.price = 0;
      p.averageCost = 0;
      await db.put('products', p);
    }
  }
  
  return product;
}

/**
 * Create a new product
 */
export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageCost'> & { initialCost?: number }
): Promise<Product> {
  const db = await getDB();
  const now = new Date();
  const product: Product = {
    name: data.name,
    quantity: data.quantity,
    category: data.category,
    price: data.price,
    averageCost: data.initialCost || 0,  // Use initialCost or default to 0
    notes: data.notes,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('products', product);
  return product;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Product> {
  const db = await getDB();
  const existing = await db.get('products', id);
  
  if (!existing) {
    throw new Error(`Product with id ${id} not found`);
  }

  const updated: Product = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
  
  await db.put('products', updated);
  return updated;
}

/**
 * Delete a product by ID
 * Also cascade deletes all associated photos
 */
export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  
  // Import photo deletion function dynamically to avoid circular dependencies
  const { deletePhotosByProductId } = await import('./photos');
  
  // Delete all photos associated with this product
  await deletePhotosByProductId(id);
  
  // Delete the product
  await db.delete('products', id);
}

/**
 * Get all products in a specific category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = await getDB();
  return db.getAllFromIndex('products', 'by-category', category);
}

/**
 * Get products count
 */
export async function getProductsCount(): Promise<number> {
  const db = await getDB();
  return db.count('products');
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const products = await getAllProducts();
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories).sort();
}

/**
 * Search products by name (case-insensitive)
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getAllProducts();
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.notes?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Clear all products (useful for testing)
 */
export async function clearAllProducts(): Promise<void> {
  const db = await getDB();
  await db.clear('products');
}

