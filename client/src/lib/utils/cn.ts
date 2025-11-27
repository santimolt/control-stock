import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un UUID v4 compatible con todos los navegadores
 * Usa crypto.randomUUID() si está disponible, sino usa un polyfill
 * @returns UUID v4 string
 */
export function generateUUID(): string {
  // Usar crypto.randomUUID() si está disponible (navegadores modernos)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Polyfill para navegadores que no soportan crypto.randomUUID()
  // Genera un UUID v4 válido
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formatea un número como moneda
 * @param amount El monto a formatear
 * @param options Opciones de formateo
 * @returns String formateado como moneda (ej: $1.234,56)
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  const { showSymbol = true, decimals = 2 } = options || {};
  
  // Formatear el número con separadores de miles y decimales
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return showSymbol ? `$${formatted}` : formatted;
}

