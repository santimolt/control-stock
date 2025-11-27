export type MovementType = 'sale' | 'production' | 'adjustment';

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unitPrice?: number;                // Solo para ventas
  unitCost?: number;                 // Solo para producción
  totalAmount: number;               // Total en dinero
  averageCostAtTime: number;         // Costo promedio al momento del movimiento
  notes?: string;
  createdAt: Date;
  productSnapshot: {
    name: string;
    category: string;
  };
}

export interface CreateMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  unitPrice?: number;  // Requerido para ventas
  unitCost?: number;   // Requerido para producción
  notes?: string;
}

export interface MovementFilters {
  productId?: string;
  type?: MovementType;
  startDate?: Date;
  endDate?: Date;
}

// Labels para UI
export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  sale: 'Venta',
  production: 'Producción',
  adjustment: 'Ajuste'
};

export const MOVEMENT_TYPE_COLORS: Record<MovementType, string> = {
  sale: 'text-green-600',
  production: 'text-blue-600',
  adjustment: 'text-yellow-600'
};

// Helper para determinar si es entrada o salida
export function isInbound(movement: Movement): boolean {
  return movement.quantity > 0;
}

export function isOutbound(movement: Movement): boolean {
  return movement.quantity < 0;
}

