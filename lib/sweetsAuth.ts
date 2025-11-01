/**
 * Authentication and access control helpers for the Sweets Economy System
 * 
 * This module provides utilities to gate access to sweets/coins features
 * based on user authentication status, account type, and account status.
 */

import type { User } from "../shared/schema";

/**
 * Check if a user has access to the sweets economy system
 * 
 * Returns false if:
 * - User is not authenticated
 * - User is a bot account
 * - User is suspended or banned
 * 
 * @param user - The user object from authentication context
 * @returns true if user can access sweets features, false otherwise
 */
export function withSweetsAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.isBot) return false;
  if (user.status === 'suspended' || user.status === 'banned') return false;
  return true;
}

/**
 * Get comprehensive authentication state for sweets system
 * 
 * @param user - The user object from authentication context
 * @returns Object containing authentication flags and user info
 */
export function getSweetsAuthState(user: User | null | undefined) {
  return {
    canAccessSweets: withSweetsAccess(user),
    isAuthenticated: !!user,
    isBot: user?.isBot || false,
    isSuspended: user?.status === 'suspended' || user?.status === 'banned',
    userId: user?.id || null
  };
}

/**
 * Get a user-friendly message explaining why sweets access is denied
 * 
 * @param user - The user object from authentication context
 * @returns Human-readable message or null if access is allowed
 */
export function getSweetsAccessDenialReason(user: User | null | undefined): string | null {
  if (!user) return "Please sign in to access the sweets economy";
  if (user.isBot) return "Bot accounts cannot access the sweets economy";
  if (user.status === 'suspended') return "Your account is suspended and cannot access the sweets economy";
  if (user.status === 'banned') return "Your account is banned and cannot access the sweets economy";
  return null;
}
