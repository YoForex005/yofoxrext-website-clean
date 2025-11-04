import cron from 'node-cron';
import { db } from '../db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { users, userPreferences } from '../../shared/schema';
import { engagementEmails } from '../services/engagementEmails';

// Daily digest - runs every day at 9:00 AM
export function scheduleDailyDigest() {
  // Schedule for 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting daily digest email job...');
    
    try {
      // Get all users who have daily digest enabled
      const usersWithDigest = await db.select({
        userId: users.id,
        email: users.email,
        username: users.username
      })
      .from(users)
      .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
      .where(and(
        eq(users.is_active, true),
        eq(users.is_email_verified, true),
        // Default to true if no preference set
        sql`COALESCE(${userPreferences.emailDailyDigest}, true) = true`
      ));

      let sent = 0;
      let failed = 0;

      // Send digest to each user
      for (const user of usersWithDigest) {
        try {
          await engagementEmails.sendDailyDigestEmail(user.userId);
          sent++;
          
          // Add delay to avoid overwhelming the email server
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send daily digest to user ${user.userId}:`, error);
          failed++;
        }
      }

      console.log(`Daily digest job completed. Sent: ${sent}, Failed: ${failed}`);
    } catch (error) {
      console.error('Error in daily digest job:', error);
    }
  });

  console.log('Daily digest email job scheduled for 9:00 AM every day');
}

// Weekly summary - runs every Monday at 10:00 AM
export function scheduleWeeklySummary() {
  // Schedule for 10:00 AM every Monday (1 = Monday)
  cron.schedule('0 10 * * 1', async () => {
    console.log('Starting weekly summary email job...');
    
    try {
      // Get all users who have weekly digest enabled
      const usersWithSummary = await db.select({
        userId: users.id,
        email: users.email,
        username: users.username
      })
      .from(users)
      .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
      .where(and(
        eq(users.is_active, true),
        eq(users.is_email_verified, true),
        // Default to true if no preference set
        sql`COALESCE(${userPreferences.emailWeeklyDigest}, true) = true`
      ));

      let sent = 0;
      let failed = 0;

      // Send summary to each user
      for (const user of usersWithSummary) {
        try {
          await engagementEmails.sendWeeklySummaryEmail(user.userId);
          sent++;
          
          // Add delay to avoid overwhelming the email server
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send weekly summary to user ${user.userId}:`, error);
          failed++;
        }
      }

      console.log(`Weekly summary job completed. Sent: ${sent}, Failed: ${failed}`);
    } catch (error) {
      console.error('Error in weekly summary job:', error);
    }
  });

  console.log('Weekly summary email job scheduled for Monday 10:00 AM');
}

// Milestone checker - runs every hour to check for achievements
export function scheduleMilestoneChecker() {
  // Schedule for every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Checking for user milestones...');
    
    try {
      // Check for various milestones
      const milestoneChecks = [
        // First thread posted
        {
          query: sql`
            SELECT u.id, u.username 
            FROM ${users} u
            WHERE (
              SELECT COUNT(*) 
              FROM forum_threads 
              WHERE author_id = u.id
            ) = 1
            AND u.created_at >= NOW() - INTERVAL '1 hour'
          `,
          milestone: "First Thread Posted",
          achievement: "You've started your journey in the YoForex community!"
        },
        // 10 threads milestone
        {
          query: sql`
            SELECT u.id, u.username 
            FROM ${users} u
            WHERE (
              SELECT COUNT(*) 
              FROM forum_threads 
              WHERE author_id = u.id
            ) = 10
          `,
          milestone: "Thread Master",
          achievement: "You've posted 10 threads! You're becoming a valuable contributor."
        },
        // 100 followers milestone
        {
          query: sql`
            SELECT u.id, u.username 
            FROM ${users} u
            WHERE (
              SELECT COUNT(*) 
              FROM user_follows 
              WHERE followed_id = u.id
            ) = 100
          `,
          milestone: "Community Leader",
          achievement: "100 traders are following your insights!"
        },
        // 1000 total likes milestone
        {
          query: sql`
            SELECT u.id, u.username 
            FROM ${users} u
            WHERE (
              SELECT COUNT(*) 
              FROM content_likes l
              JOIN forum_threads t ON l.content_id = t.id
              WHERE t.author_id = u.id
              AND l.content_type = 'thread'
            ) >= 1000
          `,
          milestone: "Popular Contributor",
          achievement: "Your content has received 1000 likes!"
        }
      ];

      // Check each milestone
      for (const check of milestoneChecks) {
        try {
          const eligibleUsers = await db.execute(check.query);
          
          for (const user of eligibleUsers.rows as any[]) {
            // Check if we've already sent this milestone
            const alreadySent = await db.execute(
              sql`
                SELECT 1 FROM email_notifications 
                WHERE user_id = ${user.id} 
                AND template_key = 'milestone_achievement'
                AND payload->>'milestone' = ${check.milestone}
                LIMIT 1
              `
            );

            if (alreadySent.rows.length === 0) {
              await engagementEmails.sendMilestoneEmail(
                user.id,
                check.milestone,
                check.achievement
              );
              
              console.log(`Milestone "${check.milestone}" sent to user ${user.username}`);
            }
          }
        } catch (error) {
          console.error(`Error checking milestone "${check.milestone}":`, error);
        }
      }
    } catch (error) {
      console.error('Error in milestone checker job:', error);
    }
  });

  console.log('Milestone checker job scheduled to run every hour');
}

// Initialize all email digest jobs
export function initializeEmailDigestJobs() {
  console.log('Initializing email digest jobs...');
  
  scheduleDailyDigest();
  scheduleWeeklySummary();
  scheduleMilestoneChecker();
  
  console.log('All email digest jobs initialized successfully');
}