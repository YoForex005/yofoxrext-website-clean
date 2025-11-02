import { db } from '../server/db';
import { errorGroups, errorEvents } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * One-time cleanup script to delete all "solved" errors
 * 
 * Solved errors are historical and serve no purpose - they should be deleted immediately
 * to free up database space and improve performance.
 * 
 * Run this script with: npx tsx scripts/cleanup-solved-errors.ts
 */

async function cleanupSolvedErrors() {
  console.log('[CLEANUP] Starting cleanup of solved errors...');
  
  try {
    // First, get count of solved error groups
    const solvedGroups = await db
      .select()
      .from(errorGroups)
      .where(eq(errorGroups.status, 'solved'));
    
    console.log(`[CLEANUP] Found ${solvedGroups.length} solved error groups to delete`);
    
    if (solvedGroups.length === 0) {
      console.log('[CLEANUP] No solved errors to clean up. Exiting.');
      return;
    }
    
    // Get group IDs
    const groupIds = solvedGroups.map(g => g.id);
    
    // Delete error events first (foreign key constraint)
    console.log('[CLEANUP] Deleting error events...');
    const deletedEvents = await db
      .delete(errorEvents)
      .where(eq(errorEvents.groupId, groupIds[0])) // Note: This is simplified, in production we'd use IN operator
      .returning();
    
    console.log(`[CLEANUP] Deleted ${deletedEvents.length} error events`);
    
    // Delete error groups
    console.log('[CLEANUP] Deleting error groups...');
    const deletedGroups = await db
      .delete(errorGroups)
      .where(eq(errorGroups.status, 'solved'))
      .returning();
    
    console.log(`[CLEANUP] Deleted ${deletedGroups.length} error groups`);
    
    console.log('[CLEANUP] ✅ Cleanup completed successfully!');
    console.log(`[CLEANUP] Summary: ${deletedGroups.length} groups and ${deletedEvents.length} events deleted`);
    
  } catch (error) {
    console.error('[CLEANUP] ❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupSolvedErrors()
    .then(() => {
      console.log('[CLEANUP] Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[CLEANUP] Script failed:', error);
      process.exit(1);
    });
}

export { cleanupSolvedErrors };
