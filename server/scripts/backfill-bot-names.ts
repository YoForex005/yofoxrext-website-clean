#!/usr/bin/env tsx

/**
 * Backfill Bot Names to Users Table
 * 
 * This script syncs firstName/lastName from bots table to users table
 * for all existing bots. This ensures email triggers can display human names
 * instead of bot usernames.
 * 
 * Usage: tsx server/scripts/backfill-bot-names.ts
 */

import { db } from '../db.js';
import { bots, users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { BotProfileService } from '../services/botProfileService.js';

const botProfileService = new BotProfileService();

async function backfillBotNames() {
  console.log('🤖 Starting bot name backfill with name generation...\n');
  
  try {
    // Get all bots from bots table
    const allBots = await db.select().from(bots);
    
    console.log(`📊 Found ${allBots.length} bots in bots table\n`);
    
    if (allBots.length === 0) {
      console.log('✅ No bots to backfill. Exiting.');
      return;
    }
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let generatedCount = 0;
    
    for (const bot of allBots) {
      console.log(`\n📝 Processing bot: ${bot.username} (ID: ${bot.id})`);
      console.log(`   Current Name: ${bot.firstName || 'N/A'} ${bot.lastName || 'N/A'}`);
      
      try {
        let firstName = bot.firstName;
        let lastName = bot.lastName;
        
        // Generate names if missing
        if (!firstName || !lastName) {
          console.log(`   🎲 Generating human names for bot...`);
          firstName = botProfileService.generateFirstName();
          lastName = botProfileService.generateLastName();
          console.log(`   ✨ Generated: ${firstName} ${lastName}`);
          
          // Update bot record in bots table with generated names
          await db.update(bots)
            .set({
              firstName,
              lastName,
              updatedAt: new Date(),
            })
            .where(eq(bots.id, bot.id));
          
          generatedCount++;
          console.log(`   ✅ Bot record updated with generated names`);
        }
        
        // Check if user entry exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, bot.id)
        });
        
        if (!existingUser) {
          // Create new user entry
          console.log(`   ➕ Creating new user entry...`);
          await db.insert(users).values({
            id: bot.id,
            username: bot.username,
            email: bot.email || `${bot.username}@yoforex-bot.internal`,
            firstName,
            lastName,
            profileImageUrl: bot.profilePictureUrl,
            isBot: true,
            role: 'member',
            status: 'active',
            totalCoins: 0,
            weeklyEarned: 0,
            level: 0,
            emailNotifications: true,
            timezone: bot.timezone || 'UTC',
            reputationScore: 0,
          });
          createdCount++;
          console.log(`   ✅ User entry created`);
        } else {
          // Update existing user entry with firstName/lastName from bot
          const needsUpdate = 
            existingUser.firstName !== firstName ||
            existingUser.lastName !== lastName ||
            existingUser.profileImageUrl !== bot.profilePictureUrl ||
            !existingUser.isBot;
          
          if (needsUpdate) {
            console.log(`   🔄 Updating existing user entry...`);
            await db.update(users)
              .set({
                firstName,
                lastName,
                profileImageUrl: bot.profilePictureUrl,
                isBot: true,
                updatedAt: new Date(),
              })
              .where(eq(users.id, bot.id));
            updatedCount++;
            console.log(`   ✅ User entry updated`);
          } else {
            console.log(`   ⏭️  User entry already up-to-date, skipping`);
            skippedCount++;
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing bot ${bot.username}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total bots processed: ${allBots.length}`);
    console.log(`🎲 Names generated for bots: ${generatedCount}`);
    console.log(`✅ User entries created: ${createdCount}`);
    console.log(`🔄 User entries updated: ${updatedCount}`);
    console.log(`⏭️  User entries skipped (already synced): ${skippedCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount}`);
    }
    console.log('='.repeat(60));
    
    // Verification query
    console.log('\n🔍 Verification: Checking bot-user sync status...\n');
    
    const verificationResults = await db
      .select({
        botId: bots.id,
        botUsername: bots.username,
        botFirstName: bots.firstName,
        botLastName: bots.lastName,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(bots)
      .leftJoin(users, eq(bots.id, users.id));
    
    let syncedCount = 0;
    let notSyncedCount = 0;
    
    for (const result of verificationResults) {
      const isSynced = 
        result.userFirstName === result.botFirstName &&
        result.userLastName === result.botLastName;
      
      if (isSynced) {
        syncedCount++;
      } else {
        notSyncedCount++;
        console.log(`⚠️  NOT SYNCED: ${result.botUsername}`);
        console.log(`   Bot: ${result.botFirstName} ${result.botLastName}`);
        console.log(`   User: ${result.userFirstName || 'N/A'} ${result.userLastName || 'N/A'}\n`);
      }
    }
    
    console.log(`✅ ${syncedCount} bots properly synced`);
    if (notSyncedCount > 0) {
      console.log(`❌ ${notSyncedCount} bots NOT synced (see details above)`);
    }
    
    console.log('\n✨ Backfill process completed!\n');
    
    if (notSyncedCount > 0) {
      console.log('⚠️  WARNING: Some bots are not properly synced.');
      console.log('   Please review the errors above and fix manually if needed.\n');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('❌ Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the script
backfillBotNames()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
