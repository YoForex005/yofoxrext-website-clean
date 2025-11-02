/**
 * Generate a unique ticket number
 * Format: TKT-{timestamp}-{random}
 * Example: TKT-LXPZ8Q9-A3C
 */
export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}
