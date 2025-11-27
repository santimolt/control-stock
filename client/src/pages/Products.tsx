import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useMovements } from '@/hooks/useMovements';
import { ProductList } from '@/components/products/ProductList';
import { ProductForm } from '@/components/products/ProductForm';
import { MovementForm } from '@/components/movements/MovementForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Product, CreateProductInput } from '@/types/product';

export function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct, refresh: refreshProducts } = useProducts();
  const { registrarVenta, registrarProduccion, registrarAjuste } = useMovements();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditFormOpen(true);
  };

  const handleRegisterMovement = (productId: string) => {
    setSelectedProductId(productId);
    setIsMovementFormOpen(true);
  };

  const handleUpdateProduct = async (data: CreateProductInput) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, data);
    setIsEditFormOpen(false);
    setEditingProduct(null);
    await refreshProducts();
  };

  // Convert Product to CreateProductInput for editing
  const getEditInitialData = (product: Product | null): Partial<CreateProductInput> | undefined => {
    if (!product) return undefined;
    return {
      name: product.name,
      quantity: product.quantity,
      category: product.category,
      price: product.price,
      initialCost: product.averageCost || undefined,
      notes: product.notes,
    };
  };

  const handleMovementSubmit = async () => {
    await refreshProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          Agregar Producto
        </Button>
      </div>

      {products.length > 0 && (
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Limpiar
            </Button>
          )}
        </div>
      )}

      <ProductList 
        products={filteredProducts} 
        onDelete={deleteProduct}
        onEdit={handleEdit}
        onRegisterMovement={handleRegisterMovement}
      />

      <ProductForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={async (data) => {
          await addProduct(data);
        }}
      />

      <ProductForm
        open={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleUpdateProduct}
        initialData={getEditInitialData(editingProduct)}
        title="Editar Producto"
      />

      <MovementForm
        open={isMovementFormOpen}
        onClose={() => {
          setIsMovementFormOpen(false);
          setSelectedProductId(undefined);
        }}
        onSubmitVenta={async (data) => {
          await registrarVenta(data);
          await handleMovementSubmit();
        }}
        onSubmitProduccion={async (data) => {
          await registrarProduccion(data);
          await handleMovementSubmit();
        }}
        onSubmitAjuste={async (data) => {
          await registrarAjuste(data);
          await handleMovementSubmit();
        }}
        preselectedProductId={selectedProductId}
      />
    </div>
  );
}

