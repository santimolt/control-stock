import type { Movement } from '@/types/movement';
import { MovementCard } from './MovementCard';

interface MovementListProps {
  movements: Movement[];
  showProduct?: boolean;
  onEdit?: (movement: Movement) => void;
  onDelete?: (id: string) => void;
}

export function MovementList({ movements, showProduct = true, onEdit, onDelete }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No hay movimientos registrados</p>
        <p className="text-sm text-muted-foreground mt-2">
          Registra tu primera venta o producción
        </p>
      </div>
    );
  }

  // Group by date
  const groupedByDate = movements.reduce((acc, movement) => {
    const date = new Date(movement.createdAt).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(movement);
    return acc;
  }, {} as Record<string, Movement[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateMovements]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 sticky top-0 bg-background py-2">
            {date}
          </h3>
          <div className="space-y-3">
            {dateMovements.map((movement) => (
              <MovementCard
                key={movement.id}
                movement={movement}
                showProduct={showProduct}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

