import { storage } from "../storage/index.js";
import type { Announcement, InsertAnnouncement } from "../../shared/schema.js";

/**
 * Communications Service
 * Handles announcement management, publishing, and scheduling
 */

/**
 * Publish an announcement - sets status to active
 * @param id - Announcement ID
 * @returns Updated announcement
 */
export async function publishAnnouncement(id: number): Promise<Announcement> {
  const announcement = await storage.updateAnnouncement(id, {
    status: 'active',
  });
  return announcement;
}

/**
 * Get preview of audience size - returns count of matching users
 * @param audience - Audience criteria
 * @returns Number of users matching criteria
 */
export async function getAudiencePreview(audience: any): Promise<number> {
  const users = await storage.getUsersByAudience(audience);
  return users.length;
}

/**
 * Schedule an announcement for future publishing
 * @param id - Announcement ID
 * @param scheduledAt - Date to publish
 * @returns Updated announcement
 */
export async function scheduleAnnouncement(id: number, scheduledAt: Date): Promise<Announcement> {
  const announcement = await storage.updateAnnouncement(id, {
    status: 'scheduled',
    scheduledAt: scheduledAt.toISOString(),
  });
  return announcement;
}

/**
 * Expire an announcement - sets status to expired
 * @param id - Announcement ID
 * @returns Updated announcement
 */
export async function expireAnnouncement(id: number): Promise<Announcement> {
  const announcement = await storage.updateAnnouncement(id, {
    status: 'expired',
  });
  return announcement;
}

/**
 * Process scheduled announcements - check for any that should be published now
 */
export async function processScheduledAnnouncements(): Promise<void> {
  try {
    const announcements = await storage.listAnnouncements({ status: 'scheduled' });
    const now = new Date();

    for (const announcement of announcements) {
      if (announcement.scheduledAt && new Date(announcement.scheduledAt) <= now) {
        await publishAnnouncement(announcement.id);
        console.log(`Published scheduled announcement ${announcement.id}: ${announcement.title}`);
      }
    }
  } catch (error) {
    console.error('Error processing scheduled announcements:', error);
  }
}

/**
 * Check and expire announcements past their expiration date
 */
export async function processExpiredAnnouncements(): Promise<void> {
  try {
    const announcements = await storage.listAnnouncements({ status: 'active' });
    const now = new Date();

    for (const announcement of announcements) {
      if (announcement.expiresAt && new Date(announcement.expiresAt) <= now) {
        await expireAnnouncement(announcement.id);
        console.log(`Expired announcement ${announcement.id}: ${announcement.title}`);
      }
    }
  } catch (error) {
    console.error('Error processing expired announcements:', error);
  }
}
