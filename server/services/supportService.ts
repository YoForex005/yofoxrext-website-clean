import { storage } from "../storage/index.js";
import { generateTicketNumber } from "../utils/ticketNumberGenerator.js";
import type { InsertSupportTicket, SupportTicket, TicketMessage } from "@shared/schema";

/**
 * Create a new support ticket for a user
 */
export async function createTicket(
  userId: string,
  data: { subject: string; description: string; category: "technical" | "billing" | "general" | "account" | "other" }
): Promise<SupportTicket> {
  const ticketNumber = generateTicketNumber();
  
  const ticketData: InsertSupportTicket = {
    ticketNumber,
    userId,
    subject: data.subject,
    description: data.description,
    category: data.category,
    status: "open",
    priority: "medium",
  };
  
  const ticket = await storage.createSupportTicket(ticketData);
  return ticket;
}

/**
 * Add a message to a ticket
 * If it's the first admin message, record the firstResponseAt timestamp
 */
export async function addMessage(
  ticketId: number,
  authorId: string,
  body: string,
  isAdmin: boolean
): Promise<TicketMessage> {
  // Create the message
  const message = await storage.createTicketMessage({
    ticketId,
    authorId,
    body,
    isAdmin,
  });
  
  // If this is an admin message, check if it's the first response
  if (isAdmin) {
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (ticket && !ticket.firstResponseAt) {
      await storage.recordFirstResponse(ticketId, new Date());
    }
    
    // Update last admin responder
    if (ticket) {
      await storage.updateSupportTicket(ticketId, {
        lastAdminResponderId: authorId,
      });
    }
  }
  
  return message;
}

/**
 * Close a support ticket and record resolution time
 */
export async function closeTicket(ticketId: number): Promise<void> {
  await storage.updateTicketStatus(ticketId, "closed");
  await storage.recordResolution(ticketId, new Date());
}

/**
 * Reopen a closed support ticket
 */
export async function reopenTicket(ticketId: number): Promise<void> {
  await storage.updateTicketStatus(ticketId, "open");
}

/**
 * Get all tickets for a specific user
 */
export async function getTicketsForUser(userId: string): Promise<SupportTicket[]> {
  return await storage.listSupportTickets({ userId });
}

/**
 * Get all tickets with optional filters (admin only)
 */
export async function getTicketsForAdmin(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}): Promise<SupportTicket[]> {
  return await storage.listSupportTickets(filters);
}

/**
 * Get ticket details with messages
 */
export async function getTicketWithMessages(ticketId: number): Promise<{
  ticket: SupportTicket | null;
  messages: TicketMessage[];
}> {
  const ticket = await storage.getSupportTicketById(ticketId);
  const messages = ticket ? await storage.listTicketMessages(ticketId) : [];
  
  return { ticket, messages };
}
