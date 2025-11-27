import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as db from '@/lib/db';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      
      try {
        const data = await db.getProductById(id);
        if (data) {
          setProduct(data);
        } else {
          navigate('/products');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, navigate]);

  const handleUpdate = async (data: Partial<Product>) => {
    if (!id) return;
    
    try {
      const updated = await db.updateProduct(id, data);
      setProduct(updated);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !product) return;
    
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      try {
        await db.deleteProduct(id);
        navigate('/products');
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Producto no encontrado</p>
        <Link to="/products">
          <Button className="mt-4">Volver a Productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to="/products">
          <Button variant="outline">← Volver</Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{product.name}</CardTitle>
          <p className="text-muted-foreground">{product.category}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cantidad</p>
              <p className={`text-3xl font-bold ${
                product.quantity === 0 
                  ? 'text-destructive' 
                  : product.quantity < 5 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
              }`}>
                {product.quantity}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold mt-1">
                {product.quantity === 0 
                  ? 'Sin Stock' 
                  : product.quantity < 5 
                    ? 'Stock Bajo' 
                    : 'En Stock'}
              </p>
            </div>
          </div>

          {product.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
              <p className="text-sm">{product.notes}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Creado</p>
                <p>{new Date(product.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última actualización</p>
                <p>{new Date(product.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductForm
        open={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSubmit={handleUpdate}
        initialData={product}
        title="Editar Producto"
      />
    </div>
  );
}

