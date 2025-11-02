import { storage } from "../storage/index.js";

export interface SupportKPIs {
  openTickets: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  satisfactionPercentage: number;
}

/**
 * Calculate support KPIs for the admin dashboard
 */
export async function calculateKPIs(): Promise<SupportKPIs> {
  const kpis = await storage.getSupportKPIs();
  
  // Convert satisfaction score (1-5) to percentage (0-100)
  const satisfactionPercentage = kpis.avgSatisfaction > 0 
    ? (kpis.avgSatisfaction / 5) * 100 
    : 0;
  
  return {
    openTickets: kpis.openTickets,
    avgResponseTimeHours: kpis.avgResponseTime,
    avgResolutionTimeHours: kpis.avgResolutionTime,
    satisfactionPercentage: Number(satisfactionPercentage.toFixed(2)),
  };
}
