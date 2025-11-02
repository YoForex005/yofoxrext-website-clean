/**
 * COMPREHENSIVE ADMIN TESTING - PHASE 1B
 * Core Operations: Marketplace, Finance, Support
 * 
 * Test Credentials: test@admin.com / admin123
 */

import { db } from '../server/db';
import { eq, sql, desc, count, and, gte, lte, isNull } from 'drizzle-orm';
import { 
  content, 
  contentPurchases, 
  withdrawalRequests, 
  supportTickets,
  supportTicketMessages,
  coinTransactions,
  users,
  adminActions
} from '../shared/schema';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const cookieJar: string[] = [];

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  statusCode: number;
  error?: string;
  data?: any;
}

const testResults: TestResult[] = [];
const performanceMetrics: { endpoint: string; avgTime: number; maxTime: number; minTime: number }[] = [];

// Helper: Make authenticated request
async function makeRequest(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ data: any; responseTime: number; statusCode: number }> {
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (cookieJar.length > 0) {
      headers['Cookie'] = cookieJar.join('; ');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    // Store cookies from response
    const setCookies = response.headers.get('set-cookie');
    if (setCookies) {
      const cookies = setCookies.split(',').map(c => c.trim().split(';')[0]);
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0];
        const existingIndex = cookieJar.findIndex(c => c.startsWith(name + '='));
        if (existingIndex >= 0) {
          cookieJar[existingIndex] = cookie;
        } else {
          cookieJar.push(cookie);
        }
      });
    }

    const responseTime = Date.now() - startTime;
    let data;
    
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return {
      data,
      responseTime,
      statusCode: response.status,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      data: null,
      responseTime,
      statusCode: 0,
      };
  }
}

// Helper: Record test result
function recordTest(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  expectedStatus: number = 200,
  error?: string,
  data?: any
) {
  const status = statusCode === expectedStatus && !error ? 'PASS' : 'FAIL';
  
  testResults.push({
    endpoint,
    method,
    status,
    responseTime,
    statusCode,
    error,
    data,
  });

  console.log(`${status} - ${method} ${endpoint} (${responseTime}ms, status: ${statusCode})`);
}

// Helper: Check performance target (<500ms)
function checkPerformance(endpoint: string, responseTime: number): boolean {
  if (responseTime > 500) {
    console.warn(`⚠️  PERFORMANCE WARNING: ${endpoint} took ${responseTime}ms (target: <500ms)`);
    return false;
  }
  return true;
}

//=============================================================================
// AUTHENTICATION
//=============================================================================
async function testAuthentication() {
  console.log('\n========================================');
  console.log('AUTHENTICATION');
  console.log('========================================\n');

  const { data, responseTime, statusCode } = await makeRequest('POST', '/api/auth/login', {
    email: 'test@admin.com',
    password: 'admin123',
  });

  if (statusCode === 200 && data.user) {
    console.log('✅ Admin login successful');
    console.log(`User: ${data.user.email}, Role: ${data.user.role}`);
    console.log(`Cookies: ${cookieJar.length} stored`);
  } else {
    console.error('❌ Admin login failed:', data);
    console.error('Response status:', statusCode);
    process.exit(1);
  }
}

//=============================================================================
// MARKETPLACE MANAGEMENT TESTS
//=============================================================================
async function testMarketplaceManagement() {
  console.log('\n========================================');
  console.log('MARKETPLACE MANAGEMENT TESTS');
  console.log('========================================\n');

  // Test 1: GET /api/admin/marketplace/stats
  console.log('\n--- Test 1: Marketplace Stats KPIs ---');
  const statsResult = await makeRequest('GET', '/api/admin/marketplace/stats');
  recordTest('/api/admin/marketplace/stats', 'GET', statsResult.statusCode, statsResult.responseTime);
  checkPerformance('/api/admin/marketplace/stats', statsResult.responseTime);

  if (statsResult.statusCode === 200) {
    console.log('Stats Data:', JSON.stringify(statsResult.data, null, 2));
    
    // Verify against database
    const dbItemCount = await db.select({ count: count() }).from(content).where(eq(content.type, 'marketplace'));
    const dbSalesCount = await db.select({ count: count() }).from(contentPurchases);
    
    console.log(`Database verification: ${dbItemCount[0].count} items, ${dbSalesCount[0].count} sales`);
  }

  // Test 2: GET /api/admin/marketplace/items (paginated)
  console.log('\n--- Test 2: Marketplace Items (Paginated) ---');
  const itemsResult = await makeRequest('GET', '/api/admin/marketplace/items?page=1&limit=20');
  recordTest('/api/admin/marketplace/items', 'GET', itemsResult.statusCode, itemsResult.responseTime);
  checkPerformance('/api/admin/marketplace/items', itemsResult.responseTime);

  let testItemId = null;
  if (itemsResult.statusCode === 200 && itemsResult.data.items?.length > 0) {
    testItemId = itemsResult.data.items[0].id;
    console.log(`Found ${itemsResult.data.items.length} items, total pages: ${itemsResult.data.totalPages}`);
  }

  // Test 3: GET /api/admin/marketplace/items/:id
  if (testItemId) {
    console.log('\n--- Test 3: Single Item Details ---');
    const itemResult = await makeRequest('GET', `/api/admin/marketplace/items/${testItemId}`);
    recordTest('/api/admin/marketplace/items/:id', 'GET', itemResult.statusCode, itemResult.responseTime);
    checkPerformance('/api/admin/marketplace/items/:id', itemResult.responseTime);
  }

  // Test 4: GET /api/admin/marketplace/items/search
  console.log('\n--- Test 4: Search Marketplace Items ---');
  const searchResult = await makeRequest('GET', '/api/admin/marketplace/items/search?q=trading');
  recordTest('/api/admin/marketplace/items/search', 'GET', searchResult.statusCode, searchResult.responseTime);
  checkPerformance('/api/admin/marketplace/items/search', searchResult.responseTime);

  // Test 5: GET /api/admin/marketplace/items/pending
  console.log('\n--- Test 5: Pending Approval Items ---');
  const pendingResult = await makeRequest('GET', '/api/admin/marketplace/items/pending');
  recordTest('/api/admin/marketplace/items/pending', 'GET', pendingResult.statusCode, pendingResult.responseTime);
  checkPerformance('/api/admin/marketplace/items/pending', pendingResult.responseTime);

  // Test 6: GET /api/admin/marketplace/revenue-trend
  console.log('\n--- Test 6: Revenue Trend Chart ---');
  const revenueTrendResult = await makeRequest('GET', '/api/admin/marketplace/revenue-trend?days=30');
  recordTest('/api/admin/marketplace/revenue-trend', 'GET', revenueTrendResult.statusCode, revenueTrendResult.responseTime);
  checkPerformance('/api/admin/marketplace/revenue-trend', revenueTrendResult.responseTime);

  if (revenueTrendResult.statusCode === 200) {
    console.log(`Revenue trend data points: ${revenueTrendResult.data?.length || 0}`);
  }

  // Test 7: GET /api/admin/marketplace/top-sellers
  console.log('\n--- Test 7: Top Selling Items ---');
  const topSellersResult = await makeRequest('GET', '/api/admin/marketplace/top-sellers?limit=10');
  recordTest('/api/admin/marketplace/top-sellers', 'GET', topSellersResult.statusCode, topSellersResult.responseTime);
  checkPerformance('/api/admin/marketplace/top-sellers', topSellersResult.responseTime);

  // Test 8: GET /api/admin/marketplace/top-vendors
  console.log('\n--- Test 8: Top Vendors ---');
  const topVendorsResult = await makeRequest('GET', '/api/admin/marketplace/top-vendors?limit=10');
  recordTest('/api/admin/marketplace/top-vendors', 'GET', topVendorsResult.statusCode, topVendorsResult.responseTime);
  checkPerformance('/api/admin/marketplace/top-vendors', topVendorsResult.responseTime);

  // Test 9: GET /api/admin/marketplace/sales
  console.log('\n--- Test 9: Sales Transactions ---');
  const salesResult = await makeRequest('GET', '/api/admin/marketplace/sales?page=1&limit=50');
  recordTest('/api/admin/marketplace/sales', 'GET', salesResult.statusCode, salesResult.responseTime);
  checkPerformance('/api/admin/marketplace/sales', salesResult.responseTime);

  // Test 10: GET /api/admin/marketplace/sales/recent
  console.log('\n--- Test 10: Recent Sales ---');
  const recentSalesResult = await makeRequest('GET', '/api/admin/marketplace/sales/recent');
  recordTest('/api/admin/marketplace/sales/recent', 'GET', recentSalesResult.statusCode, recentSalesResult.responseTime);
  checkPerformance('/api/admin/marketplace/sales/recent', recentSalesResult.responseTime);

  // Test 11: GET /api/admin/marketplace/categories
  console.log('\n--- Test 11: Category Stats ---');
  const categoriesResult = await makeRequest('GET', '/api/admin/marketplace/categories');
  recordTest('/api/admin/marketplace/categories', 'GET', categoriesResult.statusCode, categoriesResult.responseTime);
  checkPerformance('/api/admin/marketplace/categories', categoriesResult.responseTime);

  // Test 12: POST /api/admin/marketplace/approve/:itemId (if pending items exist)
  if (pendingResult.data?.length > 0) {
    console.log('\n--- Test 12: Approve Item ---');
    const approveId = pendingResult.data[0].id;
    const approveResult = await makeRequest('POST', `/api/admin/marketplace/approve/${approveId}`);
    recordTest('/api/admin/marketplace/approve/:itemId', 'POST', approveResult.statusCode, approveResult.responseTime);
    checkPerformance('/api/admin/marketplace/approve/:itemId', approveResult.responseTime);

    // Verify audit log created
    if (approveResult.statusCode === 200) {
      const auditLog = await db
        .select()
        .from(adminActions)
        .where(and(
          eq(adminActions.action, 'approve_item'),
          sql`${adminActions.metadata}->>'itemId' = ${approveId}`
        ))
        .limit(1);
      
      if (auditLog.length > 0) {
        console.log('✅ Audit log created for approval');
      } else {
        console.warn('⚠️  Audit log NOT created for approval');
      }
    }
  }

  // Test 13: POST /api/admin/marketplace/reject/:itemId
  if (testItemId) {
    console.log('\n--- Test 13: Reject Item ---');
    const rejectResult = await makeRequest('POST', `/api/admin/marketplace/reject/${testItemId}`, {
      reason: 'Test rejection for quality standards'
    });
    recordTest('/api/admin/marketplace/reject/:itemId', 'POST', rejectResult.statusCode, rejectResult.responseTime);
    checkPerformance('/api/admin/marketplace/reject/:itemId', rejectResult.responseTime);
  }
}

//=============================================================================
// FINANCE MANAGEMENT TESTS
//=============================================================================
async function testFinanceManagement() {
  console.log('\n========================================');
  console.log('FINANCE MANAGEMENT TESTS');
  console.log('========================================\n');

  // Test 1: GET /api/admin/finance/stats
  console.log('\n--- Test 1: Finance Stats KPIs ---');
  const statsResult = await makeRequest('GET', '/api/admin/finance/stats?days=30');
  recordTest('/api/admin/finance/stats', 'GET', statsResult.statusCode, statsResult.responseTime);
  checkPerformance('/api/admin/finance/stats', statsResult.responseTime);

  if (statsResult.statusCode === 200) {
    console.log('Finance Stats:', JSON.stringify(statsResult.data, null, 2));
  }

  // Test 2: GET /api/admin/finance/revenue-trend
  console.log('\n--- Test 2: Revenue Trend (7/30/90 days) ---');
  for (const days of [7, 30, 90]) {
    const trendResult = await makeRequest('GET', `/api/admin/finance/revenue-trend?days=${days}`);
    recordTest(`/api/admin/finance/revenue-trend?days=${days}`, 'GET', trendResult.statusCode, trendResult.responseTime);
    checkPerformance(`/api/admin/finance/revenue-trend?days=${days}`, trendResult.responseTime);
    
    if (trendResult.statusCode === 200) {
      console.log(`${days}-day trend has ${trendResult.data?.length || 0} data points`);
    }
  }

  // Test 3: GET /api/admin/finance/revenue-sources
  console.log('\n--- Test 3: Revenue Sources ---');
  const sourcesResult = await makeRequest('GET', '/api/admin/finance/revenue-sources?days=30');
  recordTest('/api/admin/finance/revenue-sources', 'GET', sourcesResult.statusCode, sourcesResult.responseTime);
  checkPerformance('/api/admin/finance/revenue-sources', sourcesResult.responseTime);

  // Test 4: GET /api/admin/finance/withdrawals/pending
  console.log('\n--- Test 4: Pending Withdrawals ---');
  const withdrawalsResult = await makeRequest('GET', '/api/admin/finance/withdrawals/pending?page=1&limit=20');
  recordTest('/api/admin/finance/withdrawals/pending', 'GET', withdrawalsResult.statusCode, withdrawalsResult.responseTime);
  checkPerformance('/api/admin/finance/withdrawals/pending', withdrawalsResult.responseTime);

  let testWithdrawalId = null;
  if (withdrawalsResult.statusCode === 200 && withdrawalsResult.data.withdrawals?.length > 0) {
    testWithdrawalId = withdrawalsResult.data.withdrawals[0].id;
    console.log(`Found ${withdrawalsResult.data.withdrawals.length} pending withdrawals`);
  }

  // Test 5: POST /api/admin/finance/withdrawals/approve/:id
  if (testWithdrawalId) {
    console.log('\n--- Test 5: Approve Withdrawal ---');
    
    // Get user balance before
    const withdrawal = withdrawalsResult.data.withdrawals[0];
    const userBefore = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
    const balanceBefore = userBefore[0]?.coins || 0;
    
    const approveResult = await makeRequest('POST', `/api/admin/finance/withdrawals/approve/${testWithdrawalId}`);
    recordTest('/api/admin/finance/withdrawals/approve/:id', 'POST', approveResult.statusCode, approveResult.responseTime);
    checkPerformance('/api/admin/finance/withdrawals/approve/:id', approveResult.responseTime);

    // Verify balance updated
    if (approveResult.statusCode === 200) {
      const userAfter = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
      const balanceAfter = userAfter[0]?.coins || 0;
      
      console.log(`Balance before: ${balanceBefore}, after: ${balanceAfter}, withdrawn: ${withdrawal.amount}`);
      
      if (balanceBefore - withdrawal.amount === balanceAfter) {
        console.log('✅ Balance correctly deducted');
      } else {
        console.warn('⚠️  Balance deduction mismatch');
      }

      // Check audit log
      const auditLog = await db
        .select()
        .from(adminActions)
        .where(and(
          eq(adminActions.action, 'approve_withdrawal'),
          sql`${adminActions.metadata}->>'withdrawalId' = ${testWithdrawalId}`
        ))
        .limit(1);
      
      if (auditLog.length > 0) {
        console.log('✅ Audit log created for withdrawal approval');
      } else {
        console.warn('⚠️  Audit log NOT created');
      }
    }
  }

  // Test 6: POST /api/admin/finance/withdrawals/reject/:id
  // Create a test withdrawal first
  console.log('\n--- Test 6: Reject Withdrawal ---');
  const rejectResult = await makeRequest('POST', '/api/admin/finance/withdrawals/reject/test-reject-id', {
    reason: 'Test rejection for insufficient documentation'
  });
  recordTest('/api/admin/finance/withdrawals/reject/:id', 'POST', rejectResult.statusCode, rejectResult.responseTime, 404); // Expecting 404 for fake ID
  checkPerformance('/api/admin/finance/withdrawals/reject/:id', rejectResult.responseTime);

  // Test 7: GET /api/admin/finance/export
  console.log('\n--- Test 7: Export Financial Data ---');
  const exportResult = await makeRequest('GET', '/api/admin/finance/export?days=30');
  recordTest('/api/admin/finance/export', 'GET', exportResult.statusCode, exportResult.responseTime);
  checkPerformance('/api/admin/finance/export', exportResult.responseTime);

  // Test 8: Verify double-entry accounting
  console.log('\n--- Test 8: Double-Entry Accounting Verification ---');
  const allTransactions = await db
    .select({
      totalDebits: sql<number>`SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)`,
      totalCredits: sql<number>`SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)`,
    })
    .from(coinTransactions);

  console.log('Double-entry check:', allTransactions[0]);
  if (allTransactions[0].totalDebits === allTransactions[0].totalCredits) {
    console.log('✅ Debits match credits - accounting integrity verified');
  } else {
    console.warn('⚠️  Debits DO NOT match credits - potential accounting issue');
  }
}

//=============================================================================
// SUPPORT & TICKETS TESTS
//=============================================================================
async function testSupportManagement() {
  console.log('\n========================================');
  console.log('SUPPORT & TICKETS TESTS');
  console.log('========================================\n');

  // Test 1: GET /api/admin/support/kpis
  console.log('\n--- Test 1: Support KPIs ---');
  const kpisResult = await makeRequest('GET', '/api/admin/support/kpis');
  recordTest('/api/admin/support/kpis', 'GET', kpisResult.statusCode, kpisResult.responseTime);
  checkPerformance('/api/admin/support/kpis', kpisResult.responseTime);

  if (kpisResult.statusCode === 200) {
    console.log('Support KPIs:', JSON.stringify(kpisResult.data, null, 2));
  }

  // Test 2: GET /api/admin/support/tickets
  console.log('\n--- Test 2: All Tickets ---');
  const ticketsResult = await makeRequest('GET', '/api/admin/support/tickets');
  recordTest('/api/admin/support/tickets', 'GET', ticketsResult.statusCode, ticketsResult.responseTime);
  checkPerformance('/api/admin/support/tickets', ticketsResult.responseTime);

  let testTicketId = null;
  if (ticketsResult.statusCode === 200 && ticketsResult.data?.length > 0) {
    testTicketId = ticketsResult.data[0].id;
    console.log(`Found ${ticketsResult.data.length} tickets`);
  }

  // Test 3: GET /api/admin/support/tickets/:id
  if (testTicketId) {
    console.log('\n--- Test 3: Single Ticket Details ---');
    const ticketResult = await makeRequest('GET', `/api/admin/support/tickets/${testTicketId}`);
    recordTest('/api/admin/support/tickets/:id', 'GET', ticketResult.statusCode, ticketResult.responseTime);
    checkPerformance('/api/admin/support/tickets/:id', ticketResult.responseTime);

    if (ticketResult.statusCode === 200) {
      console.log(`Ticket has ${ticketResult.data.messages?.length || 0} messages`);
    }
  }

  // Test 4: Filter tickets by status
  console.log('\n--- Test 4: Filter by Status ---');
  for (const status of ['open', 'in_progress', 'closed']) {
    const filterResult = await makeRequest('GET', `/api/admin/support/tickets?status=${status}`);
    recordTest(`/api/admin/support/tickets?status=${status}`, 'GET', filterResult.statusCode, filterResult.responseTime);
    checkPerformance(`/api/admin/support/tickets?status=${status}`, filterResult.responseTime);
  }

  // Test 5: Filter by priority
  console.log('\n--- Test 5: Filter by Priority ---');
  for (const priority of ['low', 'medium', 'high']) {
    const filterResult = await makeRequest('GET', `/api/admin/support/tickets?priority=${priority}`);
    recordTest(`/api/admin/support/tickets?priority=${priority}`, 'GET', filterResult.statusCode, filterResult.responseTime);
    checkPerformance(`/api/admin/support/tickets?priority=${priority}`, filterResult.responseTime);
  }

  // Test 6: Filter by category
  console.log('\n--- Test 6: Filter by Category ---');
  for (const category of ['technical', 'billing', 'general']) {
    const filterResult = await makeRequest('GET', `/api/admin/support/tickets?category=${category}`);
    recordTest(`/api/admin/support/tickets?category=${category}`, 'GET', filterResult.statusCode, filterResult.responseTime);
    checkPerformance(`/api/admin/support/tickets?category=${category}`, filterResult.responseTime);
  }

  // Test 7: PUT /api/admin/support/tickets/:id/status
  if (testTicketId) {
    console.log('\n--- Test 7: Update Ticket Status ---');
    const statusUpdateResult = await makeRequest('PUT', `/api/admin/support/tickets/${testTicketId}/status`, {
      status: 'in_progress'
    });
    recordTest('/api/admin/support/tickets/:id/status', 'PUT', statusUpdateResult.statusCode, statusUpdateResult.responseTime);
    checkPerformance('/api/admin/support/tickets/:id/status', statusUpdateResult.responseTime);

    // Verify status persisted
    if (statusUpdateResult.statusCode === 200) {
      const updated = await db.select().from(supportTickets).where(eq(supportTickets.id, testTicketId)).limit(1);
      if (updated[0]?.status === 'in_progress') {
        console.log('✅ Status successfully persisted');
      } else {
        console.warn('⚠️  Status update did not persist');
      }
    }
  }

  // Test 8: PUT /api/admin/support/tickets/:id/priority
  if (testTicketId) {
    console.log('\n--- Test 8: Update Ticket Priority ---');
    const priorityUpdateResult = await makeRequest('PUT', `/api/admin/support/tickets/${testTicketId}/priority`, {
      priority: 'high'
    });
    recordTest('/api/admin/support/tickets/:id/priority', 'PUT', priorityUpdateResult.statusCode, priorityUpdateResult.responseTime);
    checkPerformance('/api/admin/support/tickets/:id/priority', priorityUpdateResult.responseTime);

    // Verify priority persisted
    if (priorityUpdateResult.statusCode === 200) {
      const updated = await db.select().from(supportTickets).where(eq(supportTickets.id, testTicketId)).limit(1);
      if (updated[0]?.priority === 'high') {
        console.log('✅ Priority successfully persisted');
      } else {
        console.warn('⚠️  Priority update did not persist');
      }
    }
  }

  // Test 9: POST /api/admin/support/tickets/:id/messages
  if (testTicketId) {
    console.log('\n--- Test 9: Reply to Ticket ---');
    const messageBefore = await db.select().from(supportTickets).where(eq(supportTickets.id, testTicketId)).limit(1);
    const lastResponseBefore = messageBefore[0]?.firstResponseAt;
    
    const replyResult = await makeRequest('POST', `/api/admin/support/tickets/${testTicketId}/messages`, {
      body: 'Thank you for contacting support. We are reviewing your request.'
    });
    recordTest('/api/admin/support/tickets/:id/messages', 'POST', replyResult.statusCode, replyResult.responseTime);
    checkPerformance('/api/admin/support/tickets/:id/messages', replyResult.responseTime);

    // Verify first response timestamp set
    if (replyResult.statusCode === 200) {
      const messageAfter = await db.select().from(supportTickets).where(eq(supportTickets.id, testTicketId)).limit(1);
      if (messageAfter[0]?.firstResponseAt) {
        console.log('✅ First response timestamp recorded');
        
        // Calculate response time
        const createdAt = new Date(messageAfter[0].createdAt).getTime();
        const respondedAt = new Date(messageAfter[0].firstResponseAt).getTime();
        const responseTimeHours = (respondedAt - createdAt) / (1000 * 60 * 60);
        console.log(`Response time: ${responseTimeHours.toFixed(2)} hours`);
      }
    }
  }

  // Test 10: Close ticket and verify resolution time
  if (testTicketId) {
    console.log('\n--- Test 10: Close Ticket (Resolution Time) ---');
    const closeResult = await makeRequest('PUT', `/api/admin/support/tickets/${testTicketId}/status`, {
      status: 'closed'
    });
    recordTest('/api/admin/support/tickets/:id/status (close)', 'PUT', closeResult.statusCode, closeResult.responseTime);

    if (closeResult.statusCode === 200) {
      const closed = await db.select().from(supportTickets).where(eq(supportTickets.id, testTicketId)).limit(1);
      if (closed[0]?.resolvedAt) {
        console.log('✅ Resolution timestamp recorded');
        
        const createdAt = new Date(closed[0].createdAt).getTime();
        const resolvedAt = new Date(closed[0].resolvedAt).getTime();
        const resolutionTimeHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
        console.log(`Resolution time: ${resolutionTimeHours.toFixed(2)} hours`);
      } else {
        console.warn('⚠️  Resolution timestamp NOT recorded');
      }
    }
  }
}

//=============================================================================
// DATABASE INTEGRITY VERIFICATION
//=============================================================================
async function verifyDatabaseIntegrity() {
  console.log('\n========================================');
  console.log('DATABASE INTEGRITY VERIFICATION');
  console.log('========================================\n');

  // 1. Check for orphaned transactions
  console.log('Checking for orphaned transactions...');
  const orphanedTransactions = await db
    .select({ count: count() })
    .from(coinTransactions)
    .leftJoin(users, eq(coinTransactions.userId, users.id))
    .where(isNull(users.id));

  if (orphanedTransactions[0].count === 0) {
    console.log('✅ No orphaned transactions found');
  } else {
    console.warn(`⚠️  Found ${orphanedTransactions[0].count} orphaned transactions`);
  }

  // 2. Check for orphaned content purchases
  console.log('\nChecking for orphaned content purchases...');
  const orphanedPurchases = await db
    .select({ count: count() })
    .from(contentPurchases)
    .leftJoin(content, eq(contentPurchases.contentId, content.id))
    .where(isNull(content.id));

  if (orphanedPurchases[0].count === 0) {
    console.log('✅ No orphaned content purchases found');
  } else {
    console.warn(`⚠️  Found ${orphanedPurchases[0].count} orphaned content purchases`);
  }

  // 3. Verify all withdrawals have corresponding transactions
  console.log('\nVerifying withdrawal-transaction linkage...');
  const withdrawalsWithoutTransactions = await db
    .select({ count: count() })
    .from(withdrawalRequests)
    .leftJoin(
      coinTransactions,
      and(
        eq(withdrawalRequests.userId, coinTransactions.userId),
        eq(coinTransactions.type, 'withdrawal_debit')
      )
    )
    .where(and(
      eq(withdrawalRequests.status, 'approved'),
      isNull(coinTransactions.id)
    ));

  if (withdrawalsWithoutTransactions[0].count === 0) {
    console.log('✅ All approved withdrawals have corresponding transactions');
  } else {
    console.warn(`⚠️  Found ${withdrawalsWithoutTransactions[0].count} withdrawals missing transactions`);
  }

  // 4. Check for negative balances
  console.log('\nChecking for negative user balances...');
  const negativeBalances = await db
    .select({ count: count() })
    .from(users)
    .where(sql`coins < 0`);

  if (negativeBalances[0].count === 0) {
    console.log('✅ No negative balances found');
  } else {
    console.error(`❌ CRITICAL: Found ${negativeBalances[0].count} users with negative balances`);
  }
}

//=============================================================================
// GENERATE REPORT
//=============================================================================
function generateReport() {
  console.log('\n========================================');
  console.log('TEST REPORT SUMMARY');
  console.log('========================================\n');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'PASS').length;
  const failedTests = testResults.filter(t => t.status === 'FAIL').length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${passRate}%)`);
  console.log(`Failed: ${failedTests}\n`);

  // Performance summary
  console.log('PERFORMANCE SUMMARY:');
  console.log('-------------------');
  const avgResponseTime = testResults.reduce((sum, t) => sum + t.responseTime, 0) / totalTests;
  const maxResponseTime = Math.max(...testResults.map(t => t.responseTime));
  const minResponseTime = Math.min(...testResults.map(t => t.responseTime));
  const slowEndpoints = testResults.filter(t => t.responseTime > 500);

  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Endpoints over 500ms: ${slowEndpoints.length}\n`);

  if (slowEndpoints.length > 0) {
    console.log('SLOW ENDPOINTS:');
    slowEndpoints.forEach(e => {
      console.log(`  - ${e.method} ${e.endpoint}: ${e.responseTime}ms`);
    });
    console.log('');
  }

  // Failed tests details
  if (failedTests > 0) {
    console.log('FAILED TESTS:');
    console.log('-------------');
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`❌ ${t.method} ${t.endpoint}`);
      console.log(`   Status Code: ${t.statusCode}`);
      if (t.error) console.log(`   Error: ${t.error}`);
      console.log('');
    });
  }

  // Group by section
  console.log('\nRESULTS BY SECTION:');
  console.log('-------------------');
  
  const marketplaceTests = testResults.filter(t => t.endpoint.includes('/marketplace'));
  const financeTests = testResults.filter(t => t.endpoint.includes('/finance'));
  const supportTests = testResults.filter(t => t.endpoint.includes('/support'));

  console.log(`Marketplace: ${marketplaceTests.filter(t => t.status === 'PASS').length}/${marketplaceTests.length} passed`);
  console.log(`Finance: ${financeTests.filter(t => t.status === 'PASS').length}/${financeTests.length} passed`);
  console.log(`Support: ${supportTests.filter(t => t.status === 'PASS').length}/${supportTests.length} passed`);
}

//=============================================================================
// MAIN EXECUTION
//=============================================================================
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE ADMIN TESTING - PHASE 1B                ║');
  console.log('║  Core Operations: Marketplace, Finance, Support        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await testAuthentication();
    await testMarketplaceManagement();
    await testFinanceManagement();
    await testSupportManagement();
    await verifyDatabaseIntegrity();
    generateReport();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
