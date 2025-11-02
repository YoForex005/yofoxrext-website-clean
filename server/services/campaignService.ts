import { storage } from "../storage/index.js";
import type { EmailCampaign, EmailDelivery, InsertEmailDelivery } from "../../shared/schema.js";
import { nanoid } from "nanoid";

/**
 * Campaign Service
 * Handles email campaign sending, tracking, and delivery management
 */

/**
 * Send a campaign - creates deliveries for all targeted users
 * @param campaignId - Campaign ID
 * @returns Updated campaign
 */
export async function sendCampaign(campaignId: number): Promise<EmailCampaign> {
  const campaign = await storage.getEmailCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Update campaign status to sending
  await storage.updateEmailCampaign(campaignId, {
    status: 'sending',
  });

  try {
    // Create deliveries for all targeted users
    await createCampaignDeliveries(campaignId);

    // Update campaign status to sent
    const updatedCampaign = await storage.updateEmailCampaign(campaignId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    return updatedCampaign;
  } catch (error) {
    // Update campaign status to failed
    await storage.updateEmailCampaign(campaignId, {
      status: 'failed',
    });
    throw error;
  }
}

/**
 * Create delivery records for a campaign with tracking IDs
 * @param campaignId - Campaign ID
 */
export async function createCampaignDeliveries(campaignId: number): Promise<void> {
  const campaign = await storage.getEmailCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Get users matching audience criteria
  const users = await storage.getUsersByAudience(campaign.audience || {});
  
  // Create delivery record for each user
  for (const user of users) {
    if (!user.email) continue; // Skip users without email

    const trackingId = nanoid(32);
    
    const delivery: InsertEmailDelivery = {
      campaignId,
      userId: user.id,
      trackingId,
      email: user.email,
      status: 'pending',
    };

    await storage.createEmailDelivery(delivery);
  }

  // Update campaign total recipients
  await storage.updateEmailCampaign(campaignId, {
    totalRecipients: users.filter(u => u.email).length,
  });

  console.log(`Created ${users.length} deliveries for campaign ${campaignId}`);
}

/**
 * Embed tracking pixels and link tracking in HTML email content
 * @param html - Original HTML content
 * @param trackingId - Unique tracking ID
 * @returns HTML with tracking embedded
 */
export function embedTrackingPixels(html: string, trackingId: string): string {
  // Add tracking pixel (1x1 transparent image)
  const trackingPixel = `<img src="${process.env.BASE_URL || ''}/track/email/${trackingId}.png" width="1" height="1" style="display:none" alt="" />`;
  
  // Add tracking pixel before closing body tag, or at the end if no body tag
  let trackedHtml = html.includes('</body>') 
    ? html.replace('</body>', `${trackingPixel}</body>`)
    : html + trackingPixel;

  // Track all links by adding tracking parameter
  trackedHtml = trackedHtml.replace(
    /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
    (match, attrs, url) => {
      // Skip if it's already a tracking link
      if (url.includes('/track/email/')) {
        return match;
      }
      
      // Add click tracking redirect
      const trackingUrl = `${process.env.BASE_URL || ''}/track/email/${trackingId}?redirect=${encodeURIComponent(url)}`;
      return `<a ${attrs.replace(url, trackingUrl)}>`;
    }
  );

  return trackedHtml;
}

/**
 * Update campaign stats from delivery records
 * @param campaignId - Campaign ID
 */
export async function updateCampaignStats(campaignId: number): Promise<void> {
  const stats = await storage.getCampaignDeliveryStats(campaignId);
  
  await storage.updateEmailCampaign(campaignId, {
    opens: stats.opened,
    clicks: stats.clicked,
  });
}

/**
 * Process scheduled campaigns - check for any that should be sent now
 */
export async function processScheduledCampaigns(): Promise<void> {
  try {
    const campaigns = await storage.listEmailCampaigns({ status: 'scheduled' });
    const now = new Date();

    for (const campaign of campaigns) {
      if (campaign.scheduledAt && new Date(campaign.scheduledAt) <= now) {
        await sendCampaign(campaign.id);
        console.log(`Sent scheduled campaign ${campaign.id}: ${campaign.name}`);
      }
    }
  } catch (error) {
    console.error('Error processing scheduled campaigns:', error);
  }
}
