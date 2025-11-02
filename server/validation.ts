import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

/**
 * Input Validation & Security Module
 * 
 * This module provides comprehensive input validation and sanitization
 * to prevent XSS attacks, SQL injection, and invalid data.
 */

import { sanitizeRichTextHTML, stripHTML } from '../shared/sanitize.js';

// ============================================================================
// XSS Protection
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes malicious scripts while preserving safe HTML formatting for rich text
 * Uses centralized sanitization from shared/sanitize.ts
 */
export function sanitizeHtml(html: string): string {
  return sanitizeRichTextHTML(html);
}

/**
 * Strip all HTML tags - for plain text fields
 * Uses centralized sanitization from shared/sanitize.ts
 */
export function stripHtml(text: string): string {
  return stripHTML(text);
}

// ============================================================================
// String Validation
// ============================================================================

export const StringLimits = {
  USERNAME: { min: 3, max: 30 },
  EMAIL: { min: 5, max: 255 },
  PASSWORD: { min: 8, max: 100 },
  TITLE: { min: 10, max: 300 },
  SHORT_DESCRIPTION: { min: 10, max: 500 },
  LONG_DESCRIPTION: { min: 50, max: 50000 },
  COMMENT: { min: 1, max: 2000 },
  URL: { min: 10, max: 500 },
  SLUG: { min: 3, max: 200 },
  KEYWORD: { min: 3, max: 100 },
  META_DESCRIPTION: { min: 50, max: 160 },
} as const;

/**
 * Validate string length with proper error messages
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  limits: { min: number; max: number }
): { valid: boolean; error?: string } {
  if (value.length < limits.min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${limits.min} characters`,
    };
  }
  if (value.length > limits.max) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${limits.max} characters`,
    };
  }
  return { valid: true };
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validate that a number is positive (> 0)
 */
export function validatePositive(value: number, fieldName: string): { valid: boolean; error?: string } {
  if (value <= 0) {
    return {
      valid: false,
      error: `${fieldName} must be positive`,
    };
  }
  return { valid: true };
}

/**
 * Validate that a number is non-negative (>= 0)
 */
export function validateNonNegative(value: number, fieldName: string): { valid: boolean; error?: string } {
  if (value < 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be negative`,
    };
  }
  return { valid: true };
}

/**
 * Validate coin amount - must be positive integer
 */
export function validateCoinAmount(amount: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(amount)) {
    return {
      valid: false,
      error: "Coin amount must be an integer",
    };
  }
  if (amount <= 0) {
    return {
      valid: false,
      error: "Coin amount must be positive",
    };
  }
  if (amount > 1000000) {
    return {
      valid: false,
      error: "Coin amount cannot exceed 1,000,000",
    };
  }
  return { valid: true };
}

/**
 * Validate user has sufficient coins
 */
export function validateSufficientCoins(
  userBalance: number,
  requiredAmount: number
): { valid: boolean; error?: string } {
  if (userBalance < requiredAmount) {
    return {
      valid: false,
      error: `Insufficient coins. You have ${userBalance} coins but need ${requiredAmount}`,
    };
  }
  return { valid: true };
}

/**
 * Validate price - must be positive integer between 0 and 1M
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(price)) {
    return {
      valid: false,
      error: "Price must be an integer",
    };
  }
  if (price < 0) {
    return {
      valid: false,
      error: "Price cannot be negative",
    };
  }
  if (price > 1000000) {
    return {
      valid: false,
      error: "Price cannot exceed 1,000,000 coins",
    };
  }
  return { valid: true };
}

// ============================================================================
// Enum Validation
// ============================================================================

/**
 * Validate that a value is in an allowed set
 */
export function validateEnum<T extends string>(
  value: T,
  allowedValues: readonly T[],
  fieldName: string
): { valid: boolean; error?: string } {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }
  return { valid: true };
}

// ============================================================================
// Combined Validation Helper
// ============================================================================

/**
 * Run multiple validators and return first error
 */
export function runValidators(...validators: { valid: boolean; error?: string }[]): { valid: boolean; error?: string } {
  for (const result of validators) {
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}

// ============================================================================
// Request Body Sanitization
// ============================================================================

/**
 * Sanitize a request body object recursively
 * Strips HTML from string fields to prevent XSS
 */
export function sanitizeRequestBody(body: any, htmlFields: string[] = []): any {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized: any = Array.isArray(body) ? [] : {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // If this field should allow HTML, sanitize it; otherwise strip all HTML
      sanitized[key] = htmlFields.includes(key) ? sanitizeHtml(value) : stripHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value, htmlFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// Admin User Management Validation Schemas
// ============================================================================

/**
 * User management query params schema for GET /api/admin/users
 */
export const userManagementQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['all', 'member', 'moderator', 'admin', 'superadmin']).default('all'),
  status: z.enum(['all', 'active', 'banned', 'suspended']).default('all'),
  authMethod: z.enum(['all', 'email', 'google', 'replit']).default('all'),
  sortBy: z.enum(['createdAt', 'username', 'last_login_at', 'reputationScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Ban user schema for POST /api/admin/users/:userId/ban
 */
export const banUserSchema = z.object({
  reason: z.string().min(1, "Ban reason is required").max(500, "Ban reason must be less than 500 characters"),
  duration: z.number().positive().optional(), // hours for temporary ban (future feature)
});

// ============================================================================
// Marketplace Management Validation Schemas
// ============================================================================

/**
 * Marketplace stats query schema for GET /api/admin/marketplace/stats
 */
export const marketplaceStatsSchema = z.object({
  cache: z.boolean().optional().default(true),
});

/**
 * Revenue trend query schema for GET /api/admin/marketplace/revenue-trend
 */
export const revenueTrendSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

/**
 * Marketplace items query schema for GET /api/admin/marketplace/items
 */
export const marketplaceItemsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(['all', 'ea', 'indicator', 'article', 'source_code']).default('all'),
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'suspended']).default('all'),
  price: z.enum(['all', 'free', 'under50', '50-100', '100-200', 'over200']).default('all'),
  sortBy: z.enum(['createdAt', 'priceCoins', 'salesCount', 'revenue', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Reject item schema for POST /api/admin/marketplace/reject/:itemId
 */
export const rejectItemSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(1000, "Rejection reason must be less than 1000 characters"),
});

// ============================================================================
// Content Moderation Validation Schemas
// ============================================================================

/**
 * Moderation queue query schema for GET /api/admin/moderation/queue
 */
export const moderationQueueSchema = z.object({
  type: z.enum(['all', 'threads', 'replies']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Approve content schema for POST /api/admin/moderation/approve/:id
 */
export const approveContentSchema = z.object({
  contentType: z.enum(['thread', 'reply']),
  contentId: z.string().uuid(),
});

/**
 * Reject content schema for POST /api/admin/moderation/reject/:id
 */
export const rejectContentSchema = z.object({
  contentType: z.enum(['thread', 'reply']),
  contentId: z.string().uuid(),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(1000, "Rejection reason must be less than 1000 characters"),
});

// ============================================================================
// Finance Management Validation Schemas
// ============================================================================

/**
 * Finance stats query schema for GET /api/admin/finance/stats
 */
export const financeStatsSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

/**
 * Finance revenue trend query schema for GET /api/admin/finance/revenue-trend
 */
export const financeRevenueTrendSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

/**
 * Revenue sources query schema for GET /api/admin/finance/revenue-sources
 */
export const revenueSourcesSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

/**
 * Pending withdrawals query schema for GET /api/admin/finance/withdrawals/pending
 */
export const pendingWithdrawalsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Approve withdrawal schema for POST /api/admin/finance/withdrawals/approve/:id
 */
export const approveWithdrawalSchema = z.object({
  notes: z.string().max(500).optional(),
  twoFactorToken: z.string().optional(),
});

/**
 * Reject withdrawal schema for POST /api/admin/finance/withdrawals/reject/:id
 */
export const rejectWithdrawalSchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500, "Rejection reason must be less than 500 characters"),
});

/**
 * Finance export query schema for GET /api/admin/finance/export
 */
export const financeExportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(['all', 'marketplace_sale', 'coin_recharge', 'premium_purchase', 'withdrawal', 'refund', 'adjustment']).default('all'),
});

// ============================================================================
// Phase 3 Sweets Economy Validation Schemas
// ============================================================================

/**
 * Complete onboarding step schema for POST /api/me/onboarding/complete-step
 */
export const completeOnboardingStepSchema = z.object({
  stepId: z.enum(['profilePicture', 'firstReply', 'twoReviews', 'firstThread', 'firstPublish', 'fiftyFollowers']),
});

/**
 * Claim referral signup reward schema for POST /api/referrals/claim-signup-reward
 */
export const claimReferralSignupRewardSchema = z.object({
  referredUserId: z.string().uuid('Invalid user ID format'),
});

/**
 * Claim referral purchase reward schema for POST /api/referrals/claim-purchase-reward
 */
export const claimReferralPurchaseRewardSchema = z.object({
  referredUserId: z.string().uuid('Invalid user ID format'),
  purchaseId: z.string().uuid('Invalid purchase ID format'),
});
