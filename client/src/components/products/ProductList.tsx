import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (product: Product) => void;
  onRegisterMovement: (productId: string) => void;
}

export function ProductList({ products, onDelete, onEdit, onRegisterMovement }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No hay productos todavía</p>
        <p className="text-sm text-muted-foreground mt-2">
          Agrega tu primer producto usando el botón de arriba
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={onDelete}
          onEdit={onEdit}
          onRegisterMovement={onRegisterMovement}
        />
      ))}
    </div>
  );
}

