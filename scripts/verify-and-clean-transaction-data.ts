/**
 * Verify and Clean Transaction Data
 * 
 * This script verifies data integrity BEFORE applying database constraints.
 * It detects and optionally fixes issues that would cause constraint violations:
 * 
 * 1. Duplicate idempotency keys (violates unique constraint)
 * 2. Wrong sign errors (violates CHECK constraints):
 *    - spend transactions with amount >= 0
 *    - earn transactions with amount <= 0
 * 
 * Usage: tsx scripts/verify-and-clean-transaction-data.ts [OPTIONS]
 * 
 * Options:
 *   --dry-run              Run without making changes (default: false)
 *   --fix-duplicates       Fix duplicate idempotency keys
 *   --fix-signs            Fix incorrect amount signs
 *   --create-backup        Create backup table before changes (default: true)
 *   --skip-backup          Skip backup table creation
 * 
 * Examples:
 *   tsx scripts/verify-and-clean-transaction-data.ts --dry-run
 *   tsx scripts/verify-and-clean-transaction-data.ts --fix-duplicates --fix-signs
 *   tsx scripts/verify-and-clean-transaction-data.ts --fix-signs --skip-backup
 */

import { db } from '../server/db.js';
import { coinTransactions } from '../shared/schema.js';
import { sql, eq, isNotNull, and, or, gte, lte } from 'drizzle-orm';

interface DuplicateIdempotencyKey {
  idempotencyKey: string;
  count: number;
  transactionIds: string[];
  userIds: string[];
  amounts: number[];
  createdAts: Date[];
}

interface WrongSignTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  createdAt: Date;
  correctAmount: number;
}

interface VerificationReport {
  timestamp: string;
  duplicateIdempotencyKeys: number;
  wrongSignTransactions: number;
  duplicateDetails: DuplicateIdempotencyKey[];
  wrongSignDetails: WrongSignTransaction[];
  fixesApplied: {
    duplicatesFixed: number;
    signsFixed: number;
  };
  errors: string[];
}

async function createBackupTable(): Promise<boolean> {
  console.log('\n🔒 Creating backup table...');
  
  try {
    // Check if backup already exists
    const backupExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'coin_transactions_backup_pre_constraints'
      ) as exists
    `);
    
    if (backupExists.rows[0]?.exists) {
      console.log('⚠️  Backup table already exists: coin_transactions_backup_pre_constraints');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newBackupName = `coin_transactions_backup_${timestamp}`;
      console.log(`Creating new backup: ${newBackupName}`);
      
      await db.execute(sql`
        CREATE TABLE ${sql.identifier(newBackupName)} AS 
        SELECT * FROM coin_transactions
      `);
      
      console.log(`✅ Backup created: ${newBackupName}`);
      return true;
    }
    
    // Create new backup
    await db.execute(sql`
      CREATE TABLE coin_transactions_backup_pre_constraints AS 
      SELECT * FROM coin_transactions
    `);
    
    const count = await db.execute(sql`
      SELECT COUNT(*) as count FROM coin_transactions_backup_pre_constraints
    `);
    
    console.log(`✅ Backup created: coin_transactions_backup_pre_constraints (${count.rows[0]?.count} rows)`);
    return true;
    
  } catch (error: any) {
    console.error('❌ Failed to create backup:', error.message);
    return false;
  }
}

async function findDuplicateIdempotencyKeys(): Promise<DuplicateIdempotencyKey[]> {
  console.log('\n🔍 Checking for duplicate idempotency keys...');
  
  try {
    const duplicates = await db.execute(sql`
      SELECT 
        idempotency_key,
        COUNT(*) as count,
        ARRAY_AGG(id) as transaction_ids,
        ARRAY_AGG(user_id) as user_ids,
        ARRAY_AGG(amount) as amounts,
        ARRAY_AGG(created_at) as created_ats
      FROM coin_transactions
      WHERE idempotency_key IS NOT NULL
      GROUP BY idempotency_key
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);
    
    const results: DuplicateIdempotencyKey[] = duplicates.rows.map((row: any) => ({
      idempotencyKey: row.idempotency_key,
      count: parseInt(row.count),
      transactionIds: row.transaction_ids,
      userIds: row.user_ids,
      amounts: row.amounts.map(Number),
      createdAts: row.created_ats.map((d: any) => new Date(d)),
    }));
    
    if (results.length > 0) {
      console.log(`⚠️  Found ${results.length} duplicate idempotency keys`);
      results.slice(0, 5).forEach(dup => {
        console.log(`   - "${dup.idempotencyKey}": ${dup.count} duplicates`);
      });
      if (results.length > 5) {
        console.log(`   ... and ${results.length - 5} more`);
      }
    } else {
      console.log('✅ No duplicate idempotency keys found');
    }
    
    return results;
    
  } catch (error: any) {
    console.error('❌ Error checking duplicates:', error.message);
    return [];
  }
}

async function findWrongSignTransactions(): Promise<WrongSignTransaction[]> {
  console.log('\n🔍 Checking for wrong sign transactions...');
  
  try {
    const wrongSigns = await db.execute(sql`
      SELECT id, user_id, type, amount, description, created_at
      FROM coin_transactions
      WHERE 
        (type = 'spend' AND amount >= 0) OR
        (type = 'earn' AND amount <= 0)
      ORDER BY created_at DESC
    `);
    
    const results: WrongSignTransaction[] = wrongSigns.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: row.amount,
      description: row.description,
      createdAt: new Date(row.created_at),
      correctAmount: row.type === 'spend' ? -Math.abs(row.amount) : Math.abs(row.amount),
    }));
    
    if (results.length > 0) {
      console.log(`⚠️  Found ${results.length} transactions with wrong signs`);
      
      const wrongSpends = results.filter(t => t.type === 'spend').length;
      const wrongEarns = results.filter(t => t.type === 'earn').length;
      
      if (wrongSpends > 0) {
        console.log(`   - ${wrongSpends} spend transactions with positive amounts`);
      }
      if (wrongEarns > 0) {
        console.log(`   - ${wrongEarns} earn transactions with negative amounts`);
      }
      
      // Show first few examples
      results.slice(0, 5).forEach(tx => {
        console.log(`   - ${tx.type} transaction ${tx.id}: amount=${tx.amount} (should be ${tx.correctAmount})`);
      });
      if (results.length > 5) {
        console.log(`   ... and ${results.length - 5} more`);
      }
    } else {
      console.log('✅ No wrong sign transactions found');
    }
    
    return results;
    
  } catch (error: any) {
    console.error('❌ Error checking wrong signs:', error.message);
    return [];
  }
}

async function fixDuplicateIdempotencyKeys(
  duplicates: DuplicateIdempotencyKey[],
  dryRun: boolean
): Promise<number> {
  console.log('\n🔧 Fixing duplicate idempotency keys...');
  
  if (duplicates.length === 0) {
    console.log('No duplicates to fix');
    return 0;
  }
  
  let fixedCount = 0;
  
  for (const duplicate of duplicates) {
    try {
      // Strategy: Keep the earliest transaction, nullify idempotency_key on duplicates
      const sortedByDate = duplicate.transactionIds
        .map((id, idx) => ({
          id,
          createdAt: duplicate.createdAts[idx],
        }))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      const keepId = sortedByDate[0].id;
      const duplicateIds = sortedByDate.slice(1).map(t => t.id);
      
      if (dryRun) {
        console.log(`[DRY RUN] Would keep transaction ${keepId}, nullify ${duplicateIds.length} duplicates for key "${duplicate.idempotencyKey}"`);
      } else {
        // Nullify idempotency_key on duplicates
        for (const duplicateId of duplicateIds) {
          await db
            .update(coinTransactions)
            .set({ idempotencyKey: null })
            .where(eq(coinTransactions.id, duplicateId));
        }
        
        console.log(`✓ Fixed "${duplicate.idempotencyKey}": kept ${keepId}, nullified ${duplicateIds.length} duplicates`);
      }
      
      fixedCount += duplicateIds.length;
      
    } catch (error: any) {
      console.error(`✗ Failed to fix duplicate "${duplicate.idempotencyKey}":`, error.message);
    }
  }
  
  return fixedCount;
}

async function fixWrongSignTransactions(
  wrongSigns: WrongSignTransaction[],
  dryRun: boolean
): Promise<number> {
  console.log('\n🔧 Fixing wrong sign transactions...');
  
  if (wrongSigns.length === 0) {
    console.log('No wrong signs to fix');
    return 0;
  }
  
  let fixedCount = 0;
  
  for (const tx of wrongSigns) {
    try {
      if (dryRun) {
        console.log(`[DRY RUN] Would fix ${tx.type} transaction ${tx.id}: ${tx.amount} → ${tx.correctAmount}`);
      } else {
        await db
          .update(coinTransactions)
          .set({ amount: tx.correctAmount })
          .where(eq(coinTransactions.id, tx.id));
        
        console.log(`✓ Fixed ${tx.type} transaction ${tx.id}: ${tx.amount} → ${tx.correctAmount}`);
      }
      
      fixedCount++;
      
    } catch (error: any) {
      console.error(`✗ Failed to fix transaction ${tx.id}:`, error.message);
    }
  }
  
  return fixedCount;
}

function generateReport(report: VerificationReport, dryRun: boolean): void {
  console.log('\n' + '='.repeat(80));
  console.log('DATA VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE CLEANUP'}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('');
  
  console.log('ISSUES FOUND:');
  console.log(`  Duplicate idempotency keys: ${report.duplicateIdempotencyKeys}`);
  console.log(`  Wrong sign transactions: ${report.wrongSignTransactions}`);
  console.log('');
  
  if (report.duplicateIdempotencyKeys > 0) {
    console.log('DUPLICATE IDEMPOTENCY KEYS:');
    report.duplicateDetails.slice(0, 10).forEach((dup, idx) => {
      console.log(`  ${idx + 1}. Key: "${dup.idempotencyKey}"`);
      console.log(`     Count: ${dup.count} duplicates`);
      console.log(`     Transaction IDs: ${dup.transactionIds.slice(0, 3).join(', ')}${dup.transactionIds.length > 3 ? '...' : ''}`);
    });
    if (report.duplicateDetails.length > 10) {
      console.log(`  ... and ${report.duplicateDetails.length - 10} more`);
    }
    console.log('');
  }
  
  if (report.wrongSignTransactions > 0) {
    console.log('WRONG SIGN TRANSACTIONS:');
    report.wrongSignDetails.slice(0, 10).forEach((tx, idx) => {
      console.log(`  ${idx + 1}. ID: ${tx.id}`);
      console.log(`     Type: ${tx.type} | Amount: ${tx.amount} | Correct: ${tx.correctAmount}`);
      console.log(`     Description: ${tx.description.substring(0, 60)}${tx.description.length > 60 ? '...' : ''}`);
    });
    if (report.wrongSignDetails.length > 10) {
      console.log(`  ... and ${report.wrongSignDetails.length - 10} more`);
    }
    console.log('');
  }
  
  if (!dryRun) {
    console.log('FIXES APPLIED:');
    console.log(`  Duplicate idempotency keys fixed: ${report.fixesApplied.duplicatesFixed}`);
    console.log(`  Wrong sign transactions fixed: ${report.fixesApplied.signsFixed}`);
    console.log('');
  }
  
  if (report.errors.length > 0) {
    console.log('ERRORS:');
    report.errors.forEach((error, idx) => {
      console.log(`  ${idx + 1}. ${error}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(80));
  
  // Migration readiness check
  const totalIssues = report.duplicateIdempotencyKeys + report.wrongSignTransactions;
  const totalFixed = report.fixesApplied.duplicatesFixed + report.fixesApplied.signsFixed;
  
  console.log('\nMIGRATION READINESS:');
  
  if (dryRun && totalIssues > 0) {
    console.log(`⚠️  CANNOT APPLY MIGRATION - ${totalIssues} issues must be fixed first`);
    console.log(`Run with --fix-duplicates and/or --fix-signs to clean up data`);
  } else if (!dryRun && totalFixed > 0) {
    console.log(`✅ Fixed ${totalFixed} issues - verifying...`);
    console.log(`Re-run in --dry-run mode to verify cleanup`);
  } else if (totalIssues === 0) {
    console.log('✅ NO ISSUES FOUND - Safe to apply database constraints');
    console.log('Next step: Run scripts/apply-transaction-constraints.sql');
  }
  
  console.log('='.repeat(80));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fixDuplicates = args.includes('--fix-duplicates');
  const fixSigns = args.includes('--fix-signs');
  const createBackup = !args.includes('--skip-backup');
  
  console.log('🔍 Transaction Data Verification & Cleanup Script');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE CLEANUP'}`);
  console.log(`Fix duplicates: ${fixDuplicates ? 'YES' : 'NO'}`);
  console.log(`Fix signs: ${fixSigns ? 'YES' : 'NO'}`);
  console.log(`Create backup: ${createBackup ? 'YES' : 'NO'}`);
  console.log('');
  
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    duplicateIdempotencyKeys: 0,
    wrongSignTransactions: 0,
    duplicateDetails: [],
    wrongSignDetails: [],
    fixesApplied: {
      duplicatesFixed: 0,
      signsFixed: 0,
    },
    errors: [],
  };
  
  try {
    // Step 1: Create backup (if not dry run and not skipped)
    if (!dryRun && createBackup && (fixDuplicates || fixSigns)) {
      const backupSuccess = await createBackupTable();
      if (!backupSuccess) {
        console.error('\n❌ Failed to create backup. Aborting for safety.');
        process.exit(1);
      }
    }
    
    // Step 2: Find duplicate idempotency keys
    const duplicates = await findDuplicateIdempotencyKeys();
    report.duplicateIdempotencyKeys = duplicates.length;
    report.duplicateDetails = duplicates;
    
    // Step 3: Find wrong sign transactions
    const wrongSigns = await findWrongSignTransactions();
    report.wrongSignTransactions = wrongSigns.length;
    report.wrongSignDetails = wrongSigns;
    
    // Step 4: Apply fixes if requested
    if (fixDuplicates && duplicates.length > 0) {
      report.fixesApplied.duplicatesFixed = await fixDuplicateIdempotencyKeys(duplicates, dryRun);
    }
    
    if (fixSigns && wrongSigns.length > 0) {
      report.fixesApplied.signsFixed = await fixWrongSignTransactions(wrongSigns, dryRun);
    }
    
    // Step 5: Generate report
    generateReport(report, dryRun);
    
    // Step 6: Exit with appropriate code
    const totalIssues = report.duplicateIdempotencyKeys + report.wrongSignTransactions;
    
    if (dryRun) {
      if (totalIssues > 0) {
        console.log('\n⚠️  Issues found. Run with --fix-duplicates and/or --fix-signs to clean up.');
        process.exit(1);
      } else {
        console.log('\n✅ Data verification passed. Safe to apply constraints.');
        process.exit(0);
      }
    } else {
      if (report.fixesApplied.duplicatesFixed > 0 || report.fixesApplied.signsFixed > 0) {
        console.log('\n✅ Cleanup complete. Re-run in --dry-run mode to verify.');
        process.exit(0);
      } else if (!fixDuplicates && !fixSigns && totalIssues > 0) {
        console.log('\n⚠️  Issues found but no fix flags specified.');
        console.log('Add --fix-duplicates and/or --fix-signs to clean up.');
        process.exit(1);
      } else {
        console.log('\n✅ No issues to fix.');
        process.exit(0);
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error);
    report.errors.push(error.message);
    generateReport(report, dryRun);
    process.exit(1);
  }
}

// Run the script
main();
