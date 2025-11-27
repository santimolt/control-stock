import { useState, useEffect } from 'react';
import type { CreateProductInput } from '@/types/product';
import { PRODUCT_CATEGORIES, calculateMargin } from '@/types/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/cn';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  initialData?: Partial<CreateProductInput>;
  title?: string;
}

const getInitialFormData = (initialData?: Partial<CreateProductInput>): CreateProductInput => ({
  name: initialData?.name || '',
  quantity: initialData?.quantity || 0,
  category: initialData?.category || PRODUCT_CATEGORIES[0],
  price: initialData?.price || 0,
  initialCost: initialData?.initialCost || 0,
  notes: initialData?.notes || '',
});

export function ProductForm({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Agregar Producto'
}: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductInput>(getInitialFormData(initialData));
  const [loading, setLoading] = useState(false);

  // Initialize form when dialog opens, reset when it closes
  useEffect(() => {
    if (open) {
      // Initialize with initialData when opening
      setFormData(getInitialFormData(initialData));
    } else {
      // Reset to empty form when closing
      setFormData(getInitialFormData());
    }
  }, [open, initialData]);
  
  // Calculate margin for display
  const margin = formData.price > 0 && formData.initialCost !== undefined && formData.initialCost > 0
    ? calculateMargin(formData.price, formData.initialCost)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form after successful submission
      setFormData(getInitialFormData());
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completa los datos del producto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Mantel tropical mecánico 1m x 1m"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad Inicial *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="Ej: 5000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initialCost">Costo Inicial (opcional)</Label>
              <Input
                id="initialCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.initialCost || ''}
                onChange={(e) => setFormData({ ...formData, initialCost: parseFloat(e.target.value) || 0 })}
                placeholder="Ej: 10"
              />
              <p className="text-xs text-muted-foreground">
                Se actualizará con cada producción
              </p>
            </div>
          </div>
          
          {margin !== null && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-medium">Margen inicial:</span>{' '}
                <strong className={margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}>
                  {margin.toFixed(1)}%
                </strong>
                {' '}(Ganancia: {formatCurrency(formData.price - (formData.initialCost || 0))})
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="w-full flex justify-between gap-16">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

