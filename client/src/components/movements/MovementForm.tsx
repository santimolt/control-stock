import { useState, useEffect } from 'react';
import type { Product } from '@/types/product';
import type { MovementType, Movement } from '@/types/movement';
import { calculateMargin } from '@/types/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { getAllProducts } from '@/lib/db';
import { formatCurrency } from '@/lib/utils/cn';
import { isOutOfStock } from '@/lib/utils/stock-checks';

interface MovementFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitVenta: (data: { productId: string; quantity: number; unitPrice?: number; notes?: string }) => Promise<void>;
  onSubmitProduccion: (data: { productId: string; quantity: number; unitCost: number; notes?: string }) => Promise<void>;
  onSubmitAjuste: (data: { productId: string; quantity: number; notes?: string }) => Promise<void>;
  preselectedProductId?: string;
  preselectedType?: MovementType;
  initialMovement?: Movement;
  onUpdate?: (id: string, data: Partial<Omit<Movement, 'id' | 'createdAt' | 'productSnapshot'>>) => Promise<void>;
  title?: string;
}

type TabType = 'sale' | 'production' | 'adjustment';

export function MovementForm({
  open,
  onClose,
  onSubmitVenta,
  onSubmitProduccion,
  onSubmitAjuste,
  preselectedProductId,
  preselectedType = 'sale',
  initialMovement,
  onUpdate,
  title
}: MovementFormProps) {
  const isEditMode = !!initialMovement;
  const [activeTab, setActiveTab] = useState<TabType>(preselectedType);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [productId, setProductId] = useState(preselectedProductId || '');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [notes, setNotes] = useState('');

  // Load products when dialog opens
  useEffect(() => {
    async function loadProducts() {
      const data = await getAllProducts();
      setProducts(data);
    }
    if (open) {
      loadProducts();
    }
  }, [open]);

  // Initialize form when dialog opens or preselectedProductId changes
  useEffect(() => {
    if (open) {
      if (initialMovement) {
        // Edit mode: initialize with movement data
        setProductId(initialMovement.productId);
        setActiveTab(initialMovement.type);
        setQuantity(Math.abs(initialMovement.quantity)); // Use absolute value for display
        setUnitPrice(initialMovement.unitPrice || 0);
        setUnitCost(initialMovement.unitCost || 0);
        setNotes(initialMovement.notes || '');
      } else {
        // Create mode: initialize with defaults
        setProductId(preselectedProductId || '');
        setQuantity(1);
        setNotes('');
        setActiveTab(preselectedType);
      }
      
      if (products.length > 0) {
        const productIdToUse = initialMovement?.productId || preselectedProductId;
        if (productIdToUse) {
          const product = products.find(p => p.id === productIdToUse);
          if (product) {
            setSelectedProduct(product);
            if (!initialMovement) {
              // Only set defaults if not editing
              setUnitPrice(product.price);
              setUnitCost(product.averageCost);
            }
          }
        } else {
          setUnitPrice(0);
          setUnitCost(0);
          setSelectedProduct(null);
        }
      }
    }
  }, [open, preselectedProductId, preselectedType, products, initialMovement]);

  // Update selected product when productId changes
  useEffect(() => {
    if (!open || isEditMode) return; // Don't update prices in edit mode
    
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    if (product) {
      setUnitPrice(product.price);
      setUnitCost(product.averageCost);
    } else {
      setUnitPrice(0);
      setUnitCost(0);
    }
  }, [productId, products, open, isEditMode]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setProductId(preselectedProductId || '');
      setQuantity(1);
      setUnitPrice(0);
      setUnitCost(0);
      setNotes('');
      setActiveTab(preselectedType);
      setSelectedProduct(null);
    }
  }, [open, preselectedProductId, preselectedType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    
    setLoading(true);
    try {
      if (isEditMode && initialMovement && onUpdate) {
        // Edit mode: update existing movement
        const updateData: Partial<Omit<Movement, 'id' | 'createdAt' | 'productSnapshot'>> = {
          quantity: activeTab === 'sale' ? -quantity : quantity,
          notes,
        };
        
        if (activeTab === 'sale') {
          updateData.unitPrice = unitPrice;
          updateData.totalAmount = unitPrice * quantity;
        } else if (activeTab === 'production') {
          updateData.unitCost = unitCost;
          updateData.totalAmount = unitCost * quantity;
        } else {
          updateData.totalAmount = 0;
        }
        
        await onUpdate(initialMovement.id, updateData);
      } else {
        // Create mode: create new movement
        if (activeTab === 'sale') {
          await onSubmitVenta({ productId, quantity, unitPrice, notes });
        } else if (activeTab === 'production') {
          await onSubmitProduccion({ productId, quantity, unitCost, notes });
        } else {
          await onSubmitAjuste({ productId, quantity, notes });
        }
      }
      onClose();
      // Reset form after successful submission
      if (!isEditMode) {
        setProductId(preselectedProductId || '');
        setQuantity(1);
        setUnitPrice(0);
        setUnitCost(0);
        setNotes('');
        setActiveTab(preselectedType);
      }
    } catch (error) {
      console.error('Error submitting movement:', error);
    } finally {
      setLoading(false);
    }
  };

  const margin = selectedProduct && unitPrice > 0 && selectedProduct.averageCost > 0
    ? calculateMargin(unitPrice, selectedProduct.averageCost)
    : null;
    
  const profit = selectedProduct && unitPrice > 0
    ? (unitPrice - selectedProduct.averageCost) * quantity
    : null;
    
  const newAvgCost = selectedProduct && activeTab === 'production'
    ? isOutOfStock(selectedProduct.quantity)
      ? unitCost
      : (selectedProduct.quantity * selectedProduct.averageCost + quantity * unitCost) / (selectedProduct.quantity + quantity)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title || (isEditMode ? 'Editar Movimiento' : 'Registrar Movimiento')}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="w-full flex justify-between gap-2 border-b">
          <button
            type="button"
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'sale'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => !isEditMode && setActiveTab('sale')}
            disabled={isEditMode}
          >
            Venta
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'production'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => !isEditMode && setActiveTab('production')}
            disabled={isEditMode}
          >
            Producción
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'adjustment'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => !isEditMode && setActiveTab('adjustment')}
            disabled={isEditMode}
          >
            Ajuste
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product selector */}
          <div className="space-y-2">
            <Label htmlFor="product">Producto *</Label>
            <Select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              disabled={!!preselectedProductId || isEditMode}
            >
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.quantity})
                </option>
              ))}
            </Select>
          </div>

          {selectedProduct && (
            <>
              {/* Sale Tab */}
              {activeTab === 'sale' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedProduct.quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Disponible: {selectedProduct.quantity}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Precio Unitario *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                  
                  {profit !== null && margin !== null && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md space-y-1">
                      <p className="text-sm">
                        <strong>Total venta:</strong> {formatCurrency(unitPrice * quantity)}
                      </p>
                      <p className="text-sm">
                        <strong>Ganancia estimada:</strong> {formatCurrency(profit)} ({margin.toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Production Tab */}
              {activeTab === 'production' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad Producida *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unitCost">Costo Unitario *</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitCost}
                        onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                  
                  {newAvgCost !== null && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md space-y-1">
                      <p className="text-sm">
                        <strong>Costo total:</strong> {formatCurrency(unitCost * quantity)}
                      </p>
                      <p className="text-sm">
                        <strong>Costo promedio actual:</strong> {formatCurrency(selectedProduct.averageCost)}
                      </p>
                      <p className="text-sm">
                        <strong>Nuevo costo promedio:</strong> {formatCurrency(newAvgCost)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Adjustment Tab */}
              {activeTab === 'adjustment' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Ajuste de Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa números positivos para aumentar, negativos para reducir. Stock actual: {selectedProduct.quantity}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                    <p className="text-sm">
                      <strong>Nuevo stock:</strong> {selectedProduct.quantity + quantity}
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !productId}>
              {loading ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

