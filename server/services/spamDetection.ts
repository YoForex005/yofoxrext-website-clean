import { db } from '../db.js';
import { messages, users, spamDetectionLogs } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// Spam keywords and patterns
const SPAM_KEYWORDS = [
  'scam', 'phishing', 'crypto pump', 'buy now', 'guaranteed profit',
  'get rich quick', 'limited time offer', 'click here now', 'act now',
  'free money', 'passive income', 'double your money', 'investment opportunity',
  'binary options', 'forex signals', 'trading bot', 'guaranteed returns',
  'no risk', 'risk free', 'make money fast', 'easy money', 'work from home',
  'mlm', 'pyramid', 'ponzi', 'send money', 'wire transfer', 'bitcoin wallet',
  'crypto address', 'send btc', 'send eth', 'urgent', 'verify account',
  'confirm identity', 'suspended account', 'click link', 'reset password',
  '100% profit', 'guaranteed win', 'no losses', 'never lose'
];

const SUSPICIOUS_PATTERNS = {
  repeatedChars: /(.)\1{4,}/gi, // 5 or more repeated characters (!!!!! or aaaa)
  allCaps: /^[A-Z\s!?.,]{20,}$/, // 20+ chars all caps
  excessivePunctuation: /[!?]{3,}/g, // Multiple punctuation (!!!)
  shortDomains: /https?:\/\/[a-z0-9]{1,6}\.[a-z]{2,3}/gi, // Suspicious short URLs
  multipleUrls: /(https?:\/\/[^\s]+)/gi, // Count URLs
  cryptoAddresses: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}\b/g, // Bitcoin addresses
  phoneNumbers: /\b\d{10,}\b/g, // Phone numbers
  emailAddresses: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
};

interface SpamDetectionResult {
  isSpam: boolean;
  score: number;
  reason: string;
  flaggedKeywords: string[];
  detectionMethod: string;
}

/**
 * Detect spam in a message
 * Returns spam score 0-100:
 * - 0-30: Clean
 * - 31-60: Suspicious (flag for review)
 * - 61-100: Spam (auto-block)
 */
export async function detectSpam(
  messageBody: string,
  senderId: string,
  conversationId?: string
): Promise<SpamDetectionResult> {
  let score = 0;
  const flaggedKeywords: string[] = [];
  const reasons: string[] = [];
  let primaryMethod = 'keyword';

  // 1. Keyword Detection (max 40 points)
  const lowerMessage = messageBody.toLowerCase();
  let keywordMatches = 0;
  
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      keywordMatches++;
      flaggedKeywords.push(keyword);
    }
  }
  
  if (keywordMatches > 0) {
    const keywordScore = Math.min(keywordMatches * 8, 40); // 8 points per keyword, max 40
    score += keywordScore;
    reasons.push(`${keywordMatches} spam keyword(s) detected`);
  }

  // 2. Pattern Detection (max 35 points)
  // Repeated characters
  const repeatedMatches = messageBody.match(SUSPICIOUS_PATTERNS.repeatedChars);
  if (repeatedMatches && repeatedMatches.length > 0) {
    score += Math.min(repeatedMatches.length * 5, 15);
    reasons.push('Repeated characters detected');
    primaryMethod = 'pattern';
  }

  // All caps
  if (SUSPICIOUS_PATTERNS.allCaps.test(messageBody)) {
    score += 10;
    reasons.push('Excessive caps usage');
    primaryMethod = 'pattern';
  }

  // Excessive punctuation
  const punctuationMatches = messageBody.match(SUSPICIOUS_PATTERNS.excessivePunctuation);
  if (punctuationMatches && punctuationMatches.length > 2) {
    score += 5;
    reasons.push('Excessive punctuation');
  }

  // Multiple URLs
  const urlMatches = messageBody.match(SUSPICIOUS_PATTERNS.multipleUrls);
  if (urlMatches && urlMatches.length >= 3) {
    score += 15;
    reasons.push(`${urlMatches.length} URLs detected`);
    primaryMethod = 'pattern';
  }

  // Short/suspicious domains
  const shortDomainMatches = messageBody.match(SUSPICIOUS_PATTERNS.shortDomains);
  if (shortDomainMatches && shortDomainMatches.length > 0) {
    score += 10;
    reasons.push('Suspicious short URL detected');
  }

  // Crypto addresses
  const cryptoMatches = messageBody.match(SUSPICIOUS_PATTERNS.cryptoAddresses);
  if (cryptoMatches && cryptoMatches.length > 0) {
    score += 20;
    reasons.push('Cryptocurrency address detected');
    flaggedKeywords.push('crypto_address');
  }

  // 3. Duplicate Message Detection (max 25 points)
  try {
    // Check if same message was sent recently (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, senderId),
          gte(messages.createdAt, fiveMinutesAgo)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(10);

    let duplicateCount = 0;
    for (const msg of recentMessages) {
      // Check for exact or near-exact duplicate (90% similar)
      const similarity = calculateStringSimilarity(msg.body, messageBody);
      if (similarity > 0.9) {
        duplicateCount++;
      }
    }

    if (duplicateCount >= 3) {
      score += 25;
      reasons.push(`Message sent ${duplicateCount} times in 5 minutes`);
      primaryMethod = 'rate_limit';
    } else if (duplicateCount >= 2) {
      score += 15;
      reasons.push('Duplicate message detected');
    }
  } catch (error) {
    console.error('Error checking duplicate messages:', error);
  }

  // 4. Message Length Patterns
  if (messageBody.length < 10) {
    // Very short messages with URLs or keywords
    if ((urlMatches && urlMatches.length > 0) || keywordMatches > 0) {
      score += 10;
      reasons.push('Suspicious short message');
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine if spam based on score
  const isSpam = score > 60;
  const reason = reasons.length > 0 
    ? reasons.join(', ') 
    : score > 30 
      ? 'Suspicious content detected' 
      : 'Clean';

  return {
    isSpam,
    score,
    reason,
    flaggedKeywords,
    detectionMethod: primaryMethod
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns value between 0 (completely different) and 1 (identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Log spam detection result
 */
export async function logSpamDetection(
  messageId: string | undefined,
  senderId: string,
  result: SpamDetectionResult,
  actionTaken: 'flagged' | 'blocked' | 'deleted' | 'none'
): Promise<void> {
  try {
    await db.insert(spamDetectionLogs).values({
      messageId: messageId || null,
      senderId,
      detectionMethod: result.detectionMethod,
      spamScore: result.score,
      flaggedKeywords: result.flaggedKeywords,
      actionTaken,
    });
  } catch (error) {
    console.error('Error logging spam detection:', error);
  }
}

/**
 * Get user's spam score history
 * Returns average spam score from last 10 messages
 */
export async function getUserSpamHistory(userId: string): Promise<number> {
  try {
    const recentLogs = await db
      .select()
      .from(spamDetectionLogs)
      .where(eq(spamDetectionLogs.senderId, userId))
      .orderBy(desc(spamDetectionLogs.createdAt))
      .limit(10);

    if (recentLogs.length === 0) {
      return 0;
    }

    const averageScore = recentLogs.reduce((sum, log) => sum + log.spamScore, 0) / recentLogs.length;
    return Math.round(averageScore);
  } catch (error) {
    console.error('Error getting user spam history:', error);
    return 0;
  }
}

/**
 * Check if user should be auto-suspended for repeated spam
 * Returns true if user has sent 3+ spam messages (score > 60) in the last hour
 */
export async function shouldAutoSuspendUser(userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentLogs = await db
      .select()
      .from(spamDetectionLogs)
      .where(
        and(
          eq(spamDetectionLogs.senderId, userId),
          gte(spamDetectionLogs.createdAt, oneHourAgo)
        )
      );

    const spamCount = recentLogs.filter(log => log.spamScore > 60).length;
    return spamCount >= 3;
  } catch (error) {
    console.error('Error checking auto-suspend:', error);
    return false;
  }
}
