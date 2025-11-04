import { emailService } from './emailService';
import { db } from '../db';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { users, forumThreads, forumReplies, contentLikes, userFollows, notifications, userPreferences, emailNotifications, unsubscribeTokens } from '../../shared/schema';
import { format, formatDistanceToNow } from 'date-fns';
import nodemailer from 'nodemailer';
import { emailTrackingService } from './emailTracking';

// Create SMTP transporter with Hostinger configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // Use SSL/TLS for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Helper function to send emails with tracking
async function sendEmailWithTracking(options: {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  templateKey?: string;
}): Promise<void> {
  try {
    let trackingId: string | undefined;
    let finalHtml = options.html;

    // Add tracking if userId is provided
    if (options.userId) {
      try {
        // Generate tracking ID
        trackingId = emailTrackingService.generateTrackingId();
        
        // Generate and store unsubscribe token
        const unsubscribeToken = emailTrackingService.generateUnsubscribeToken();
        const tokenHash = emailTrackingService.hashToken(unsubscribeToken);
        
        // Store unsubscribe token in database (expires in 90 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);
        
        await db.insert(unsubscribeTokens).values({
          userId: options.userId,
          tokenHash,
          notificationId: trackingId,
          expiresAt
        });

        // Create email notification record with tracking ID
        await db.insert(emailNotifications).values({
          id: trackingId, // Use tracking ID as notification ID
          userId: options.userId,
          templateKey: options.templateKey || 'engagement_email',
          recipientEmail: options.to,
          subject: options.subject,
          payload: {},
          status: 'queued'
        });

        // Add tracking pixel
        finalHtml = emailTrackingService.insertTrackingPixel(finalHtml, trackingId);

        // Wrap trackable links
        finalHtml = emailTrackingService.wrapTrackableLinks(finalHtml, trackingId);

        // Add unsubscribe link with token
        finalHtml = emailTrackingService.addUnsubscribeLink(finalHtml, unsubscribeToken, options.to);

      } catch (error) {
        console.error('Error adding email tracking:', error);
        // Continue without tracking if there's an error
      }
    }

    // Wrap content in email template
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">YoForex</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Your Forex Trading Community</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            ${finalHtml}
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
              © 2025 YoForex. All rights reserved.
            </p>
            <p style="margin: 0;">
              <a href="${process.env.BASE_URL}/settings/notifications" style="color: #2563eb; font-size: 12px; text-decoration: none;">Email Preferences</a>
              <span style="color: #d1d5db; margin: 0 8px;">|</span>
              <a href="${process.env.BASE_URL}/unsubscribe" style="color: #2563eb; font-size: 12px; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: wrappedHtml
    });

    // Update email status to sent
    if (trackingId) {
      await db.update(emailNotifications)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        })
        .where(eq(emailNotifications.id, trackingId));
    }
    
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Email template interfaces
interface ThreadData {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  authorUsername: string;
  excerpt: string;
}

interface ReplyData {
  id: string;
  body: string;
  authorUsername: string;
  authorAvatar?: string;
  threadTitle: string;
  threadSlug: string;
  categorySlug: string;
}

interface EngagementData {
  likes?: number;
  replies?: number;
  views?: number;
  followers?: number;
}

// Check if user has email notifications enabled
async function checkEmailPreference(userId: string, notificationType: string): Promise<boolean> {
  try {
    const prefs = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    if (!prefs.length) return true; // Default to enabled if no preferences
    
    const pref = prefs[0];
    switch (notificationType) {
      case 'thread_posted':
        return pref.emailOnThreadPosted !== false;
      case 'reply_received':
        return pref.emailOnReply !== false;
      case 'like_received':
        return pref.emailOnLike !== false;
      case 'follow_received':
        return pref.emailOnFollow !== false;
      case 'daily_digest':
        return pref.emailDailyDigest !== false;
      case 'weekly_digest':
        return pref.emailWeeklyDigest !== false;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return false;
  }
}

// 1. Thread Posted Confirmation Email
export async function sendThreadPostedEmail(userId: string, threadData: ThreadData) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(userId, 'thread_posted')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    const threadUrl = `${process.env.BASE_URL}/thread/${threadData.categorySlug}/${threadData.slug}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">🎉 Your thread is live!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Great news! Your thread "<strong>${threadData.title}</strong>" has been successfully posted and is now live in the YoForex community.
        </p>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${threadData.title}</h3>
          <p style="color: #6b7280; margin: 12px 0;">${threadData.excerpt}</p>
          <a href="${threadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            View Your Thread
          </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Pro Tip:</strong> Engage with users who reply to your thread to boost its visibility and earn more engagement coins!
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          Track your thread's performance:
        </p>
        <ul style="color: #6b7280; font-size: 14px;">
          <li>Views and engagement metrics</li>
          <li>Replies and discussions</li>
          <li>Coins earned from interactions</li>
        </ul>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
          Happy trading!<br>
          The YoForex Team
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `✅ Your thread "${threadData.title}" is live!`,
      html: emailContent,
      userId: userId,
      templateKey: 'thread_posted'
    });
    
    console.log(`Thread posted email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending thread posted email:', error);
  }
}

// 2. Reply Notification Email
export async function sendReplyNotificationEmail(threadAuthorId: string, replyData: ReplyData) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(threadAuthorId, 'reply_received')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, threadAuthorId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    const threadUrl = `${process.env.BASE_URL}/thread/${replyData.categorySlug}/${replyData.threadSlug}#reply-${replyData.id}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">💬 New reply to your thread</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          <strong>${replyData.authorUsername}</strong> just replied to your thread "<strong>${replyData.threadTitle}</strong>"
        </p>
        
        <div style="background: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
              <span style="font-weight: bold; color: #4b5563;">${replyData.authorUsername.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <strong style="color: #1f2937;">${replyData.authorUsername}</strong>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Just now</p>
            </div>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin: 0;">
            ${replyData.body.substring(0, 200)}${replyData.body.length > 200 ? '...' : ''}
          </p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${threadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Reply & Respond
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          💰 <strong>Earn coins</strong> by replying and keeping the conversation going!
        </p>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
          Stay engaged,<br>
          The YoForex Team
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `${replyData.authorUsername} replied to "${replyData.threadTitle}"`,
      html: emailContent,
      userId: threadAuthorId,
      templateKey: 'reply_notification'
    });
    
    console.log(`Reply notification email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending reply notification email:', error);
  }
}

// 3. Like Notification Email (batched)
export async function sendLikeNotificationEmail(userId: string, likeCount: number, contentTitle: string) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(userId, 'like_received')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">❤️ Your content is getting love!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Your post "<strong>${contentTitle}</strong>" received <strong>${likeCount} new like${likeCount > 1 ? 's' : ''}</strong>!
        </p>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
          <h3 style="margin: 0 0 8px 0; color: #92400e;">Keep it up!</h3>
          <p style="margin: 0; color: #92400e;">Your content is resonating with the community</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          Popular content gets:
        </p>
        <ul style="color: #6b7280; font-size: 14px;">
          <li>🏆 More visibility in trending sections</li>
          <li>💰 Bonus engagement coins</li>
          <li>📈 Higher reputation score</li>
        </ul>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.BASE_URL}/profile/${user[0].username}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Your Profile
          </a>
        </div>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
          Keep creating great content!<br>
          The YoForex Team
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `❤️ ${likeCount} new like${likeCount > 1 ? 's' : ''} on your post!`,
      html: emailContent,
      userId: userId,
      templateKey: 'like_notification'
    });
    
    console.log(`Like notification email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending like notification email:', error);
  }
}

// 4. Follow Notification Email
export async function sendFollowNotificationEmail(followedUserId: string, followerUsername: string) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(followedUserId, 'follow_received')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, followedUserId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    const followerProfileUrl = `${process.env.BASE_URL}/profile/${followerUsername}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">👥 You have a new follower!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          <strong>${followerUsername}</strong> is now following you on YoForex!
        </p>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span style="font-size: 24px; font-weight: bold; color: white;">${followerUsername.charAt(0).toUpperCase()}</span>
          </div>
          <h3 style="margin: 8px 0; color: #1f2937;">${followerUsername}</h3>
          <a href="${followerProfileUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 12px;">
            View Profile
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          💡 <strong>Growing your network:</strong> Check out their profile and consider following back to build connections in the trading community!
        </p>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
          Building connections,<br>
          The YoForex Team
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `${followerUsername} is now following you!`,
      html: emailContent,
      userId: followedUserId,
      templateKey: 'follow_notification'
    });
    
    console.log(`Follow notification email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending follow notification email:', error);
  }
}

// 5. Daily Engagement Digest Email
export async function sendDailyDigestEmail(userId: string) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(userId, 'daily_digest')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    // Get engagement stats for the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get thread stats
    const threadStats = await db.select({
      views: sql<number>`COALESCE(SUM(${forumThreads.viewCount}), 0)`,
      likes: sql<number>`COALESCE(COUNT(DISTINCT ${contentLikes.id}), 0)`,
      replies: sql<number>`COALESCE(COUNT(DISTINCT ${forumReplies.id}), 0)`
    })
    .from(forumThreads)
    .leftJoin(likes, and(
      eq(contentLikes.contentId, forumThreads.id),
      eq(contentLikes.contentType, 'thread'),
      gte(contentLikes.createdAt, yesterday)
    ))
    .leftJoin(posts, and(
      eq(forumReplies.threadId, forumThreads.id),
      gte(forumReplies.createdAt, yesterday)
    ))
    .where(eq(forumThreads.authorId, userId));

    // Get new followers count
    const newFollowers = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(userFollows)
    .where(and(
      eq(userFollows.followedId, userId),
      gte(userFollows.createdAt, yesterday)
    ));

    const stats = {
      views: threadStats[0]?.views || 0,
      likes: threadStats[0]?.likes || 0,
      replies: threadStats[0]?.replies || 0,
      followers: newFollowers[0]?.count || 0
    };

    // Get trending threads
    const trendingThreads = await db.select({
      title: forumThreads.title,
      slug: forumThreads.slug,
      categorySlug: forumThreads.categorySlug,
      viewCount: forumThreads.viewCount
    })
    .from(forumThreads)
    .where(gte(forumThreads.createdAt, yesterday))
    .orderBy(desc(forumThreads.viewCount))
    .limit(3);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">📊 Your Daily YoForex Digest</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username}, here's what happened in the last 24 hours:
        </p>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0;">
          <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${stats.views}</div>
            <div style="color: #64748b; font-size: 14px;">Profile Views</div>
          </div>
          <div style="background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${stats.likes}</div>
            <div style="color: #64748b; font-size: 14px;">New Likes</div>
          </div>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${stats.replies}</div>
            <div style="color: #64748b; font-size: 14px;">Thread Replies</div>
          </div>
          <div style="background: #faf5ff; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #9333ea;">${stats.followers}</div>
            <div style="color: #64748b; font-size: 14px;">New Followers</div>
          </div>
        </div>
        
        ${trendingThreads.length > 0 ? `
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">🔥 Trending Threads Today</h3>
            <ul style="list-style: none; padding: 0;">
              ${trendingThreads.map(thread => `
                <li style="margin: 12px 0;">
                  <a href="${process.env.BASE_URL}/thread/${thread.categorySlug}/${thread.slug}" 
                     style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${thread.title}
                  </a>
                  <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">
                    ${thread.viewCount} views
                  </span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Engagement Tip:</strong> Reply to comments on your threads to boost engagement by up to 40%!
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.BASE_URL}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Full Dashboard
          </a>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; text-align: center;">
          This is your daily digest. You can adjust your email preferences in your settings.
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `📊 Daily Digest: ${stats.views} views, ${stats.likes} likes, ${stats.followers} new followers`,
      html: emailContent,
      userId: userId,
      templateKey: 'daily_digest'
    });
    
    console.log(`Daily digest email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending daily digest email:', error);
  }
}

// 6. Weekly Summary Email
export async function sendWeeklySummaryEmail(userId: string) {
  try {
    // Check if user wants this notification
    if (!await checkEmailPreference(userId, 'weekly_digest')) return;

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    // Get stats for the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get comprehensive weekly stats
    const weeklyStats = await db.select({
      totalThreads: sql<number>`COUNT(DISTINCT ${forumThreads.id})`,
      totalViews: sql<number>`COALESCE(SUM(${forumThreads.viewCount}), 0)`,
      totalLikes: sql<number>`(
        SELECT COUNT(*) FROM ${contentLikes} 
        WHERE ${contentLikes.createdAt} >= ${weekAgo}
        AND ${contentLikes.contentId} IN (
          SELECT ${forumThreads.id} FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${userId}
        )
      )`,
      totalReplies: sql<number>`(
        SELECT COUNT(*) FROM ${forumReplies}
        WHERE ${forumReplies.createdAt} >= ${weekAgo}
        AND ${forumReplies.threadId} IN (
          SELECT ${forumThreads.id} FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${userId}
        )
      )`
    })
    .from(forumThreads)
    .where(and(
      eq(forumThreads.authorId, userId),
      gte(forumThreads.createdAt, weekAgo)
    ));

    const stats = weeklyStats[0] || { totalThreads: 0, totalViews: 0, totalLikes: 0, totalReplies: 0 };

    // Get top performing thread
    const topThread = await db.select({
      title: forumThreads.title,
      slug: forumThreads.slug,
      categorySlug: forumThreads.categorySlug,
      viewCount: forumThreads.viewCount,
      score: forumThreads.score
    })
    .from(forumThreads)
    .where(and(
      eq(forumThreads.authorId, userId),
      gte(forumThreads.createdAt, weekAgo)
    ))
    .orderBy(desc(forumThreads.score))
    .limit(1);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">📈 Your Weekly YoForex Summary</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Hi ${user[0].username}, here's your weekly performance overview:
        </p>
        
        <!-- Weekly Stats -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">This Week's Achievements</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px;">
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${stats.totalThreads}</div>
              <div style="color: #64748b; font-size: 14px;">Threads Posted</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${stats.totalViews}</div>
              <div style="color: #64748b; font-size: 14px;">Total Views</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${stats.totalLikes}</div>
              <div style="color: #64748b; font-size: 14px;">Likes Received</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${stats.totalReplies}</div>
              <div style="color: #64748b; font-size: 14px;">Replies Generated</div>
            </div>
          </div>
        </div>
        
        ${topThread.length > 0 ? `
          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #14532d;">🏆 Your Top Performing Thread</h3>
            <p style="margin: 12px 0;">
              <a href="${process.env.BASE_URL}/thread/${topThread[0].categorySlug}/${topThread[0].slug}" 
                 style="color: #16a34a; text-decoration: none; font-weight: bold; font-size: 16px;">
                ${topThread[0].title}
              </a>
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
              ${topThread[0].viewCount} views • Score: ${topThread[0].score}
            </p>
          </div>
        ` : ''}
        
        <!-- Recommendations -->
        <div style="background: #fefce8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #713f12;">📚 Recommendations for Next Week</h3>
          <ul style="color: #854d0e; line-height: 1.8;">
            ${stats.totalThreads === 0 ? 
              '<li>Start by posting your first thread to engage with the community</li>' :
              '<li>Keep the momentum going! Try to post 2-3 quality threads</li>'
            }
            ${stats.totalReplies < 5 ? 
              '<li>Engage more with your audience - reply to comments on your threads</li>' :
              '<li>Great engagement! Keep replying to maintain conversation quality</li>'
            }
            <li>Share your expertise in trending topics to gain more visibility</li>
            <li>Use relevant hashtags to improve discoverability</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.BASE_URL}/analytics" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Detailed Analytics
          </a>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; text-align: center;">
          This is your weekly summary. Adjust email preferences in your settings.
        </p>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `📈 Weekly Summary: ${stats.totalViews} views, ${stats.totalLikes} likes this week`,
      html: emailContent,
      userId: userId,
      templateKey: 'weekly_summary'
    });
    
    console.log(`Weekly summary email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending weekly summary email:', error);
  }
}

// 7. Milestone Achievement Email
export async function sendMilestoneEmail(userId: string, milestone: string, achievement: string) {
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].email) return;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 64px;">🏆</div>
          <h1 style="color: #2563eb; margin: 16px 0;">Milestone Achieved!</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          Congratulations ${user[0].username}!
        </p>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <h2 style="margin: 0 0 12px 0; color: #78350f;">${milestone}</h2>
          <p style="margin: 0; color: #92400e; font-size: 16px;">${achievement}</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px; text-align: center;">
          Keep up the amazing work! Your contributions make YoForex better for everyone.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.BASE_URL}/achievements" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View All Achievements
          </a>
        </div>
      </div>
    `;

    await sendEmailWithTracking({
      to: user[0].email,
      subject: `🏆 Achievement Unlocked: ${milestone}!`,
      html: emailContent,
      userId: userId,
      templateKey: 'milestone_achievement'
    });
    
    console.log(`Milestone email sent to ${user[0].email}`);
  } catch (error) {
    console.error('Error sending milestone email:', error);
  }
}

// Export all email functions
export const engagementEmails = {
  sendThreadPostedEmail,
  sendReplyNotificationEmail,
  sendLikeNotificationEmail,
  sendFollowNotificationEmail,
  sendDailyDigestEmail,
  sendWeeklySummaryEmail,
  sendMilestoneEmail
};