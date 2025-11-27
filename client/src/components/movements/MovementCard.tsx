import type { Movement } from '@/types/movement';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/types/movement';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/cn';

interface MovementCardProps {
  movement: Movement;
  showProduct?: boolean;
  onEdit?: (movement: Movement) => void;
  onDelete?: (id: string) => void;
}

export function MovementCard({ movement, showProduct = true, onEdit, onDelete }: MovementCardProps) {
  const typeLabel = MOVEMENT_TYPE_LABELS[movement.type];
  const typeColor = MOVEMENT_TYPE_COLORS[movement.type];
  
  const displayAmount = movement.type === 'sale' 
    ? `+${formatCurrency(movement.totalAmount)}`
    : movement.type === 'production'
      ? `-${formatCurrency(movement.totalAmount)}`
      : formatCurrency(0);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`¿Estás seguro de eliminar este movimiento?`)) {
      onDelete(movement.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(movement);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-semibold text-lg ${typeColor}`}>{typeLabel}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(movement.createdAt).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {showProduct && (
              <p className="font-medium">{movement.productSnapshot.name}</p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span>
                Cantidad: <strong>{Math.abs(movement.quantity)}</strong>
              </span>
              
              {movement.unitPrice && (
                <span>
                  Precio: <strong>{formatCurrency(movement.unitPrice)}</strong>
                </span>
              )}
              
              {movement.unitCost !== undefined && (
                <span>
                  Costo: <strong>{formatCurrency(movement.unitCost)}</strong>
                </span>
              )}
            </div>
            
            {movement.notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {movement.notes}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className={`text-lg font-bold ${
                movement.type === 'sale' ? 'text-green-600' : 
                movement.type === 'production' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {displayAmount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Costo promedio: {formatCurrency(movement.averageCostAtTime)}
              </p>
            </div>
            
            {(onEdit || onDelete) && (
              <div className="flex gap-2 mt-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

