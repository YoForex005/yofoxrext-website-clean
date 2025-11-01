import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage/index.js';
import { type InsertAiLog } from '../../shared/schema.js';

/**
 * Gemini Bot Service
 * Handles AI-powered bot reply generation with rate limiting and failure handling
 */

const MAX_WORDS = 200;
const MAX_REQUESTS_PER_HOUR = 100; // Can be configured via bot_settings later
const CONSECUTIVE_FAILURE_THRESHOLD = 3;

let geminiClient: any = null;
let isGeminiPaused = false;

/**
 * Initialize Gemini client
 */
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    geminiClient = new GoogleGenAI(apiKey);
  }
  return geminiClient;
}

/**
 * Count words in a text string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate bot reply to a forum thread using Gemini AI
 * @param threadContent - Thread title and content
 * @param maxWords - Maximum word count (default 180)
 * @param botId - Bot ID for logging
 * @returns Generated reply text or null if failed
 */
export async function generateBotReply(
  threadContent: { title: string; content: string; categoryName?: string },
  maxWords: number = 180,
  botId?: string
): Promise<string | null> {
  const startTime = Date.now();

  // Check if Gemini is paused due to failures
  if (isGeminiPaused) {
    console.warn('[GEMINI] Service paused due to consecutive failures');
    return null;
  }

  // Check rate limiting
  const status = await checkGeminiApiStatus();
  if (status.requestsToday >= MAX_REQUESTS_PER_HOUR) {
    console.warn('[GEMINI] Rate limit exceeded for today');
    await logAiCall('gemini', 'generate_bot_reply', 'rate_limited', null, null, null, botId, Date.now() - startTime);
    return null;
  }

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful forex trading community member responding to a forum thread.

Thread Category: ${threadContent.categoryName || 'General Discussion'}
Thread Title: ${threadContent.title}
Thread Content: ${threadContent.content}

Guidelines:
- Write a helpful, natural-sounding reply (like a real trader would)
- Be friendly, supportive, and knowledgeable
- Keep it under ${maxWords} words
- Don't mention you're an AI
- Use casual but professional language
- If appropriate, share trading insights or ask clarifying questions
- Avoid generic responses

Write your reply:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let replyText = response.text();

    // Validate word count
    const wordCount = countWords(replyText);
    if (wordCount > maxWords) {
      // Truncate to max words
      const words = replyText.split(/\s+/);
      replyText = words.slice(0, maxWords).join(' ') + '...';
    }

    const latency = Date.now() - startTime;

    // Log successful call
    await logAiCall('gemini', 'generate_bot_reply', 'success', {
      threadTitle: threadContent.title,
      maxWords,
      actualWords: countWords(replyText)
    }, {
      reply: replyText,
      wordCount: countWords(replyText)
    }, null, botId, latency);

    console.log(`[GEMINI] Generated reply (${countWords(replyText)} words) in ${latency}ms`);

    return replyText;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';

    // Log failed call
    await logAiCall('gemini', 'generate_bot_reply', 'failed', {
      threadTitle: threadContent.title,
      maxWords
    }, null, errorMessage, botId, latency);

    console.error('[GEMINI] Failed to generate reply:', errorMessage);

    // Check if we should pause Gemini
    await checkAndPauseIfNeeded();

    return null;
  }
}

/**
 * Check Gemini API status and get usage stats
 */
export async function checkGeminiApiStatus() {
  return await storage.getGeminiStatus();
}

/**
 * Log an AI API call to the database
 */
async function logAiCall(
  service: 'gemini' | 'openai' | 'anthropic',
  operation: string,
  status: 'success' | 'failed' | 'rate_limited' | 'timeout',
  requestData: any | null,
  responseData: any | null,
  errorMessage: string | null,
  botId: string | undefined,
  latencyMs: number
): Promise<void> {
  try {
    const logData: InsertAiLog = {
      service,
      operation,
      status,
      requestData: requestData || undefined,
      responseData: responseData || undefined,
      errorMessage: errorMessage || undefined,
      latencyMs,
      botId: botId || undefined,
      tokensUsed: undefined // Can be added later if API provides token usage
    };

    await storage.logAiCall(logData);
  } catch (error) {
    console.error('[GEMINI] Failed to log AI call:', error);
  }
}

/**
 * Check consecutive failures and pause Gemini if threshold exceeded
 */
async function checkAndPauseIfNeeded(): Promise<void> {
  const status = await checkGeminiApiStatus();

  if (status.consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
    isGeminiPaused = true;
    console.error(`[GEMINI] Pausing service due to ${status.consecutiveFailures} consecutive failures`);

    // TODO: Send admin alert (email or in-app notification)
    // This can be integrated with the existing emailService
  }
}

/**
 * Resume Gemini service (admin action)
 */
export function resumeGeminiService(): void {
  isGeminiPaused = false;
  console.log('[GEMINI] Service resumed by admin');
}

/**
 * Check if Gemini service is paused
 */
export function isGeminiServicePaused(): boolean {
  return isGeminiPaused;
}

/**
 * Generate multiple bot replies in parallel (batch operation)
 * @param threads - Array of threads to reply to
 * @param maxReplies - Maximum number of replies to generate
 * @returns Array of generated replies
 */
export async function generateBatchReplies(
  threads: Array<{ id: string; title: string; content: string; categoryName?: string }>,
  maxReplies: number = 5
): Promise<Array<{ threadId: string; reply: string | null }>> {
  const results: Array<{ threadId: string; reply: string | null }> = [];

  // Limit to maxReplies to avoid rate limiting
  const threadsToProcess = threads.slice(0, maxReplies);

  for (const thread of threadsToProcess) {
    const reply = await generateBotReply({
      title: thread.title,
      content: thread.content,
      categoryName: thread.categoryName
    });

    results.push({
      threadId: thread.id,
      reply
    });

    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Get Gemini usage stats for admin dashboard
 */
export async function getGeminiUsageStats(): Promise<{
  requestsToday: number;
  requestsThisWeek: number;
  successRate: number;
  averageLatency: number;
  status: 'active' | 'failed' | 'rate_limited';
  isPaused: boolean;
}> {
  const status = await checkGeminiApiStatus();

  // Get weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyLogs = await storage.getAiLogs({
    service: 'gemini',
    limit: 1000
  });

  const weeklyRequests = weeklyLogs.filter(log => 
    new Date(log.createdAt) >= weekAgo
  );

  const successCount = weeklyRequests.filter(log => log.status === 'success').length;
  const totalLatency = weeklyRequests.reduce((sum, log) => sum + (log.latencyMs || 0), 0);

  return {
    requestsToday: status.requestsToday,
    requestsThisWeek: weeklyRequests.length,
    successRate: weeklyRequests.length > 0 ? (successCount / weeklyRequests.length) * 100 : 0,
    averageLatency: weeklyRequests.length > 0 ? totalLatency / weeklyRequests.length : 0,
    status: status.status,
    isPaused: isGeminiPaused
  };
}
