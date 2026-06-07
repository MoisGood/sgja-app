import { toast } from 'sonner';

export function handleError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const prefix = context ? `[${context}] ` : '';
  console.error(`${prefix}${message}`, error);
  toast.error(context ? `${context}: ${message}` : message);
}

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showError(message: string): void {
  toast.error(message);
}

// Para operaciones fire-and-forget (cleanup, limpieza) — solo log, sin toast
export function logError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const prefix = context ? `[${context}] ` : '';
  console.error(`${prefix}${message}`, error);
}
