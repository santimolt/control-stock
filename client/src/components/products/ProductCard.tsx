import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/cn";
import { getStockStatusColor } from "@/lib/utils/stock-checks";
import { getPhotosByProductId, createPhotoURL } from "@/lib/db/photos";

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onRegisterMovement: (productId: string) => void;
}

export function ProductCard({
  product,
  onDelete,
  onEdit,
  onRegisterMovement,
}: ProductCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Load first photo for product
  useEffect(() => {
    let url: string | null = null;
    
    async function loadPhoto() {
      try {
        const photos = await getPhotosByProductId(product.id);
        if (photos.length > 0) {
          url = createPhotoURL(photos[0], true); // Use thumbnail
          setPhotoUrl(url);
        }
      } catch (error) {
        console.error('Error loading photo:', error);
      }
    }

    loadPhoto();

    // Cleanup
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [product.id]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      onDelete(product.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleRegisterMovement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegisterMovement(product.id);
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
      {/* Product Photo */}
      {photoUrl ? (
        <div className="w-full h-64 overflow-hidden rounded-t-lg">
          <img
            src={photoUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-100 rounded-t-lg flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No hay imagen disponible</span>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{product.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cantidad:</span>
            <span className={`text-lg font-bold ${getStockStatusColor(product.quantity)}`}>
              {product.quantity}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Precio de venta:</span>{" "}
            <span className="text-sm font-bold">
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Costo promedio:</span>{" "}
            <span className="text-sm font-bold">
              {product.averageCost
                ? formatCurrency(product.averageCost)
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Margen de ganancia:</span>{" "}
            <span className="text-sm font-bold">
              {product.averageCost
                ? formatCurrency(product.price - product.averageCost)
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Última actualización:</span>{" "}
            <span className="text-xs text-muted-foreground self-start">
              {new Date(product.updatedAt).toLocaleDateString()}
            </span>
          </div>
          {product.notes && (<div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Notas:</span>{" "}
            <span className="text-xs p-2 rounded-md bg-muted whitespace-pre-wrap">
                {product.notes}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-16 mt-auto">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex-1"
          >
            Eliminar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRegisterMovement}
            className="flex-1"
          >
            Movimiento
          </Button>
      </CardFooter>
    </Card>
  );
}
