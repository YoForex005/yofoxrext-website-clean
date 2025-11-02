// Using simple browser-compatible hash function instead of crypto-js

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  route?: string;
  component?: string;
  props?: any;
  userDescription?: string;
  errorType?: 'api_error' | 'resource' | 'websocket' | 'validation' | 'ssr' | 'third-party' | 'performance' | 'cors' | 'csp' | 'upload';
  resourceUrl?: string;
  performanceMetrics?: any;
  validationDetails?: any;
  apiError?: {
    url: string;
    method: string;
    status: number;
    statusText: string;
    actualErrorMessage: string;
    parsedResponse: any;
    rawResponse?: string;
  };
}

export interface BrowserInfo {
  name?: string;
  version?: string;
  os?: string;
  userAgent: string;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
}

export interface RequestInfo {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  responseStatus?: number;
  responseText?: string;
}

export interface ErrorEvent {
  fingerprint: string;
  message: string;
  component?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  stackTrace?: string;
  context: ErrorContext;
  browserInfo: BrowserInfo;
  requestInfo?: RequestInfo;
  userDescription?: string;
  timestamp: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: ErrorEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private baseDelay = 1000; // 1 second base delay for exponential backoff
  private sessionId: string;
  private enabled = true;
  private interceptors: Set<() => void> = new Set();
  private performanceObserver: PerformanceObserver | null = null;
  private resourceErrorHandler: ((e: Event) => void) | null = null;
  private securityPolicyHandler: ((e: SecurityPolicyViolationEvent) => void) | null = null;
  private socketErrorHandlers: Map<any, () => void> = new Map();
  
  // Circuit Breaker for Rate Limiting
  private circuitBreakerActive = false;
  private circuitBreakerUntil = 0;
  private consecutiveRateLimitErrors = 0;
  private readonly maxConsecutiveRateLimits = 3; // Activate circuit breaker after 3 consecutive 429s
  private readonly circuitBreakerDuration = 5 * 60 * 1000; // 5 minutes
  
  // Deduplication
  private sentFingerprints: Set<string> = new Set();
  private fingerprintExpiry: Map<string, number> = new Map();
  private readonly fingerprintTTL = 60 * 60 * 1000; // 1 hour

  private constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
      this.loadUnsentErrors();
      this.setupErrorHandlers();
      this.setupConsoleInterception();
      this.setupResourceErrorHandlers();
      this.setupPerformanceObserver();
      this.setupSecurityHandlers();
      this.setupZodErrorHandling();
    } else {
      // Server-side: create minimal instance
      this.sessionId = 'ssr-' + Date.now();
    }
  }

  static getInstance(): ErrorTracker | null {
    // Only create instance in browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(message: string, component?: string, stackTrace?: string): string {
    // Extract top 3 stack frames if available
    const stackFrames = stackTrace?.split('\n').slice(0, 4).join('\n') || '';
    
    // Create a unique fingerprint using message, component, and top stack frames
    const fingerprintData = `${message}|${component || 'unknown'}|${stackFrames}`;
    
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Basic browser detection
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || '';
    }
    
    // Detect OS
    let os = 'Unknown';
    if (platform.indexOf('Win') > -1) os = 'Windows';
    else if (platform.indexOf('Mac') > -1) os = 'MacOS';
    else if (platform.indexOf('Linux') > -1) os = 'Linux';
    else if (platform.indexOf('Android') > -1) os = 'Android';
    else if (platform.indexOf('iOS') > -1) os = 'iOS';
    
    return {
      name: browserName,
      version: browserVersion,
      os,
      userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
      },
    };
  }

  private getCurrentRoute(): string {
    // Try to get route from various sources
    if (typeof window !== 'undefined') {
      // Check for React Router location
      if ((window as any).__reactRouterContext) {
        return (window as any).__reactRouterContext.location.pathname;
      }
      // Fall back to window location
      return window.location.pathname;
    }
    return 'unknown';
  }

  private setupErrorHandlers(): void {
    // Handle window.onerror events
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (this.enabled) {
        this.captureError(
          error || new Error(String(message)),
          {
            component: 'window.onerror',
            source,
            lineno,
            colno,
          },
          'error'
        );
      }
      
      // Call original handler if exists
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandledrejection events
    window.addEventListener('unhandledrejection', (event) => {
      if (this.enabled) {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
        
        this.captureError(
          error,
          {
            component: 'unhandledrejection',
            promise: event.promise,
          },
          'error'
        );
      }
    });

    // Store cleanup function
    this.interceptors.add(() => {
      window.onerror = originalOnError;
    });
  }

  private setupConsoleInterception(): void {
    // Intercept console.error and console.warn
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      if (this.enabled) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Generate stack trace
        const stackTrace = new Error().stack || '';
        
        this.captureError(
          new Error(message),
          {
            component: 'console.error',
            args,
          },
          'error'
        );
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (this.enabled) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        this.captureError(
          new Error(message),
          {
            component: 'console.warn',
            args,
          },
          'warning'
        );
      }
      
      // Call original console.warn
      originalConsoleWarn.apply(console, args);
    };

    // Store cleanup functions
    this.interceptors.add(() => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    });
  }

  public captureError(
    error: Error | string,
    additionalContext?: any,
    severity: 'critical' | 'error' | 'warning' | 'info' = 'error',
    userDescription?: string
  ): void {
    try {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const message = errorObj.message || 'Unknown error';
      const stackTrace = errorObj.stack || '';
      const component = additionalContext?.component || this.extractComponentFromStack(stackTrace);
      
      const errorEvent: ErrorEvent = {
        fingerprint: this.generateFingerprint(message, component, stackTrace),
        message,
        component,
        severity,
        stackTrace,
        context: {
          sessionId: this.sessionId,
          route: this.getCurrentRoute(),
          ...additionalContext,
        },
        browserInfo: this.getBrowserInfo(),
        userDescription,
        timestamp: Date.now(),
      };

      this.queueError(errorEvent);
    } catch (e) {
      // Fail silently to prevent infinite error loops
      console.warn('ErrorTracker failed to capture error:', e);
    }
  }

  public captureAPIError(
    url: string,
    method: string,
    status: number,
    responseText?: string,
    headers?: Record<string, string>
  ): void {
    // Parse the response body to extract the actual error message
    let parsedError: any = null;
    let actualErrorMessage = '';
    
    try {
      if (responseText) {
        parsedError = JSON.parse(responseText);
        // Extract the actual error message from various possible formats
        actualErrorMessage = parsedError?.error || 
                           parsedError?.message || 
                           parsedError?.details || 
                           parsedError?.errorMessage ||
                           '';
      }
    } catch (e) {
      // If parsing fails, use the raw response text
      actualErrorMessage = responseText?.substring(0, 200) || '';
    }

    // Check if this is a CORS error - don't track these as they're handled by the browser
    if (actualErrorMessage.includes('CORS') || actualErrorMessage.includes('Not allowed by CORS')) {
      console.info('[API] CORS error detected, not tracking:', actualErrorMessage);
      return;
    }

    // Create comprehensive error message
    const message = actualErrorMessage 
      ? `API Error (${status}): ${actualErrorMessage} [${method} ${url}]`
      : `API Error: ${method} ${url} returned ${status}`;
    
    // Enhanced context with parsed error details
    const errorContext = {
      sessionId: this.sessionId,
      route: this.getCurrentRoute(),
      errorType: 'api_error' as const,
      apiError: {
        url,
        method,
        status,
        statusText: status >= 500 ? 'Server Error' : status >= 400 ? 'Client Error' : 'Unknown',
        actualErrorMessage,
        parsedResponse: parsedError,
        rawResponse: responseText?.substring(0, 500), // Store first 500 chars of raw response
      },
    };

    // Determine severity based on status code and endpoint
    const severity = this.determineErrorSeverity(status, url);
    
    // Log to console for immediate debugging
    // Use different console methods based on severity
    const logMethod = severity === 'critical' || severity === 'error' ? 'error' : 
                     severity === 'warning' ? 'warn' : 'info';
    console[logMethod]('[API Error]', {
      message,
      url,
      method,
      status,
      severity,
      actualError: actualErrorMessage,
      response: parsedError || responseText?.substring(0, 200),
      route: this.getCurrentRoute(),
      timestamp: new Date().toISOString(),
    });
    
    const errorEvent: ErrorEvent = {
      fingerprint: this.generateFingerprint(message, 'api', url),
      message,
      component: 'api',
      severity,
      stackTrace: new Error().stack,
      context: errorContext,
      browserInfo: this.getBrowserInfo(),
      requestInfo: {
        url,
        method,
        headers,
        responseStatus: status,
        responseText: responseText?.substring(0, 1000), // Store first 1000 chars
      },
      timestamp: Date.now(),
    };

    this.queueError(errorEvent);
  }

  private extractComponentFromStack(stackTrace: string): string | undefined {
    // Try to extract React component name from stack trace
    const componentMatch = stackTrace.match(/at (\w+) \(.*\.(jsx?|tsx?):/);
    return componentMatch?.[1];
  }

  /**
   * Check if a 401 error is expected for a given endpoint
   * These endpoints commonly return 401 for unauthenticated users as part of normal flow
   */
  private isExpected401Endpoint(url: string): boolean {
    const whitelistedPatterns = [
      '/api/me',           // Checks if user is logged in
      '/api/auth/',        // Authentication endpoints
      '/api/user/',        // User-specific endpoints when not logged in
    ];
    
    return whitelistedPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Determine error severity based on HTTP status code and endpoint
   * 
   * Severity rules:
   * - 5xx errors: "critical" - Server errors that need immediate attention
   * - 429 errors: "warning" - Rate limiting, expected under high load
   * - 401 errors: "info" - Expected for unauthenticated requests (checking login state)
   * - 404 errors: "info" - Expected for missing resources (deleted content, wrong URLs)
   * - Other 4xx errors: "error" - Client errors that may need investigation
   */
  private determineErrorSeverity(status: number, url: string): 'critical' | 'error' | 'warning' | 'info' {
    // 5xx errors are critical server errors
    if (status >= 500) {
      return 'critical';
    }
    
    // 429 (rate limit) is a warning - expected under high load
    if (status === 429) {
      return 'warning';
    }
    
    // 401 errors are typically expected when checking authentication state
    // Log as "info" since this is normal behavior for unauthenticated users
    if (status === 401) {
      return 'info';
    }
    
    // 404 errors are expected when users navigate to deleted/non-existent content
    // Log as "info" since this is normal user behavior
    if (status === 404) {
      return 'info';
    }
    
    // All other 4xx errors are client errors
    return 'error';
  }

  private queueError(errorEvent: ErrorEvent): void {
    // Check circuit breaker
    if (this.circuitBreakerActive && Date.now() < this.circuitBreakerUntil) {
      // Circuit breaker is active, silently drop errors
      console.warn('[ErrorTracker] Circuit breaker active, dropping error:', errorEvent.message);
      return;
    }
    
    // Reset circuit breaker if duration has passed
    if (this.circuitBreakerActive && Date.now() >= this.circuitBreakerUntil) {
      this.circuitBreakerActive = false;
      this.consecutiveRateLimitErrors = 0;
      console.info('[ErrorTracker] Circuit breaker reset');
    }
    
    // Deduplication: Check if we've recently sent this error
    const now = Date.now();
    const expiry = this.fingerprintExpiry.get(errorEvent.fingerprint);
    
    if (expiry && expiry > now) {
      // This error was recently sent, skip it
      console.debug('[ErrorTracker] Skipping duplicate error:', errorEvent.fingerprint);
      return;
    }
    
    // Clean up expired fingerprints
    for (const [fp, exp] of this.fingerprintExpiry.entries()) {
      if (exp <= now) {
        this.fingerprintExpiry.delete(fp);
        this.sentFingerprints.delete(fp);
      }
    }
    
    this.errorQueue.push(errorEvent);
    
    // Check if we should send immediately (10 errors accumulated)
    if (this.errorQueue.length >= 10) {
      this.sendBatch();
    } else {
      // Otherwise, schedule batch sending
      this.scheduleBatch();
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimer) return;
    
    // Send batch after 5 seconds
    this.batchTimer = setTimeout(() => {
      this.sendBatch();
    }, 5000);
  }

  private async sendBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.errorQueue.length === 0) return;

    // Check circuit breaker before sending
    if (this.circuitBreakerActive && Date.now() < this.circuitBreakerUntil) {
      console.warn('[ErrorTracker] Circuit breaker active, clearing queue without sending');
      this.errorQueue = [];
      return;
    }

    const batch = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Validate and sanitize error data before sending
      const validatedErrors = batch.map(error => {
        // Ensure all required fields have proper values
        const sanitizedError = {
          fingerprint: error.fingerprint || this.generateFingerprint(error.message, error.component, error.stackTrace),
          message: (error.message || 'Unknown error').substring(0, 1000), // Truncate message to 1000 chars
          component: error.component || 'unknown',
          severity: error.severity || 'error',
          stackTrace: error.stackTrace?.substring(0, 5000), // Limit stack trace length
          context: {
            sessionId: error.context?.sessionId || this.sessionId,
            route: error.context?.route || this.getCurrentRoute(),
            // Only include safe context properties
            ...(error.context?.errorType && { errorType: error.context.errorType }),
            ...(error.context?.component && { component: error.context.component }),
          },
          browserInfo: error.browserInfo ? {
            name: error.browserInfo.name,
            version: error.browserInfo.version,
            os: error.browserInfo.os,
            userAgent: error.browserInfo.userAgent?.substring(0, 500), // Limit user agent length
            viewport: error.browserInfo.viewport,
            screen: error.browserInfo.screen,
          } : undefined,
          requestInfo: error.requestInfo ? {
            url: error.requestInfo.url?.substring(0, 500),
            method: error.requestInfo.method,
            responseStatus: error.requestInfo.responseStatus,
            responseText: error.requestInfo.responseText?.substring(0, 1000), // Limit response text
          } : undefined,
          userDescription: error.userDescription?.substring(0, 5000),
          sessionId: error.context?.sessionId || this.sessionId,
        };
        
        return sanitizedError;
      });
      
      // Chunk validated errors into batches of 20 (API limit - reduced from 50 to prevent "request entity too large" errors)
      const BATCH_SIZE = 20;
      const batches = [];
      for (let i = 0; i < validatedErrors.length; i += BATCH_SIZE) {
        batches.push(validatedErrors.slice(i, i + BATCH_SIZE));
      }

      console.debug(`[ErrorTracker] Sending ${validatedErrors.length} errors in ${batches.length} batch(es)`);

      // Send each batch separately
      let allSuccessful = true;
      let rateLimitEncountered = false;

      for (let i = 0; i < batches.length; i++) {
        const batchChunk = batches[i];
        
        const response = await fetch('/api/telemetry/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errors: batchChunk,
          }),
        });

        if (response.ok) {
          // Success for this batch chunk
          console.debug(`[ErrorTracker] Successfully sent batch ${i + 1}/${batches.length} (${batchChunk.length} errors)`);
        } else if (response.status === 429) {
          // Rate limited
          console.warn(`[ErrorTracker] Rate limited on batch ${i + 1}/${batches.length}`);
          rateLimitEncountered = true;
          allSuccessful = false;
          // Don't break - log but continue with next batch
        } else {
          // Other error
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          console.error(`[ErrorTracker] Batch ${i + 1}/${batches.length} submission failed:`, errorData);
          allSuccessful = false;
          // Don't break - continue with next batch
        }
      }

      // Handle overall result
      if (allSuccessful) {
        // All batches successful - mark fingerprints as sent
        const now = Date.now();
        batch.forEach(error => {
          this.sentFingerprints.add(error.fingerprint);
          this.fingerprintExpiry.set(error.fingerprint, now + this.fingerprintTTL);
        });
        
        // Reset retry count and circuit breaker counters
        this.retryCount = 0;
        this.consecutiveRateLimitErrors = 0;
        
        // Clear from localStorage
        this.clearStoredErrors();
        
        console.debug(`[ErrorTracker] Successfully sent all ${batch.length} errors in ${batches.length} batch(es)`);
      } else if (rateLimitEncountered) {
        // Handle rate limiting
        this.consecutiveRateLimitErrors++;
        
        console.warn(`[ErrorTracker] Rate limited (${this.consecutiveRateLimitErrors}/${this.maxConsecutiveRateLimits})`);
        
        if (this.consecutiveRateLimitErrors >= this.maxConsecutiveRateLimits) {
          // Activate circuit breaker
          this.circuitBreakerActive = true;
          this.circuitBreakerUntil = Date.now() + this.circuitBreakerDuration;
          
          console.error(`[ErrorTracker] Circuit breaker activated until ${new Date(this.circuitBreakerUntil).toISOString()}`);
          
          // Clear the queue to prevent infinite retry loops
          this.errorQueue = [];
          this.clearStoredErrors();
        } else {
          // Re-queue for retry with exponential backoff
          this.errorQueue = [...batch, ...this.errorQueue];
          this.storeUnsentErrors();
          
          if (this.retryCount < this.maxRetries) {
            const delay = this.baseDelay * Math.pow(2, this.retryCount);
            this.retryCount++;
            
            console.info(`[ErrorTracker] Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
              this.sendBatch();
            }, delay);
          } else {
            console.error('[ErrorTracker] Max retries reached, giving up');
            this.errorQueue = [];
            this.clearStoredErrors();
          }
        }
      } else {
        // Some batches failed but not due to rate limiting
        console.error('[ErrorTracker] Some batches failed to send');
        // Don't retry - errors are already logged
      }
    } catch (error) {
      console.error('[ErrorTracker] Error sending batch:', error);
      
      // Re-queue errors for retry
      this.errorQueue = [...batch, ...this.errorQueue];
      
      // Store in localStorage for persistence
      this.storeUnsentErrors();
      
      // Implement exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, this.retryCount);
        this.retryCount++;
        
        setTimeout(() => {
          this.sendBatch();
        }, delay);
      } else {
        console.error('[ErrorTracker] Max retries reached after network error, clearing queue');
        this.errorQueue = [];
        this.clearStoredErrors();
      }
    }
  }

  private storeUnsentErrors(): void {
    try {
      localStorage.setItem('errorTracker_queue', JSON.stringify(this.errorQueue));
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }

  private loadUnsentErrors(): void {
    try {
      const stored = localStorage.getItem('errorTracker_queue');
      if (stored) {
        const errors = JSON.parse(stored);
        this.errorQueue = errors;
        localStorage.removeItem('errorTracker_queue');
        
        // Schedule sending of loaded errors
        if (this.errorQueue.length > 0) {
          this.scheduleBatch();
        }
      }
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }

  private clearStoredErrors(): void {
    try {
      localStorage.removeItem('errorTracker_queue');
    } catch (e) {
      // Fail silently
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getUserId(): string | undefined {
    // This would be set by the app when user logs in
    return (window as any).__errorTrackerUserId;
  }

  public setUserId(userId: string | undefined): void {
    (window as any).__errorTrackerUserId = userId;
  }

  public addUserDescription(description: string): void {
    // Add description to the most recent error
    if (this.errorQueue.length > 0) {
      this.errorQueue[this.errorQueue.length - 1].userDescription = description;
    }
  }

  public forceFlush(): Promise<void> {
    return this.sendBatch();
  }

  public cleanup(): void {
    // Clean up all interceptors
    this.interceptors.forEach(cleanup => cleanup());
    this.interceptors.clear();
    
    // Clean up performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    // Clean up resource error handler
    if (this.resourceErrorHandler) {
      window.removeEventListener('error', this.resourceErrorHandler, true);
      this.resourceErrorHandler = null;
    }
    
    // Clean up security policy handler
    if (this.securityPolicyHandler) {
      window.removeEventListener('securitypolicyviolation', this.securityPolicyHandler);
      this.securityPolicyHandler = null;
    }
    
    // Clear socket error handlers
    this.socketErrorHandlers.clear();
    
    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Send remaining errors
    this.forceFlush();
  }

  // Method to integrate with fetch API
  public wrapFetch(originalFetch: typeof fetch): typeof fetch {
    return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        url = 'unknown';
      }
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      
      try {
        const response = await originalFetch(input, init);
        
        // Capture API errors
        if (!response.ok && response.status >= 400) {
          const responseText = await response.text();
          this.captureAPIError(
            url,
            method,
            response.status,
            responseText,
            Object.fromEntries(response.headers.entries())
          );
          
          // Return a new response with the same text
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        
        return response;
      } catch (error) {
        // Capture network errors
        this.captureError(
          error as Error,
          {
            component: 'fetch',
            url,
            method,
          },
          'critical'
        );
        throw error;
      }
    };
  }

  // New method: Setup Resource Error Handlers
  private setupResourceErrorHandlers(): void {
    this.resourceErrorHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLImageElement || 
          target instanceof HTMLScriptElement || 
          target instanceof HTMLLinkElement) {
        
        const resourceUrl = 
          (target as HTMLImageElement).src || 
          (target as HTMLScriptElement).src || 
          (target as HTMLLinkElement).href;
        
        const resourceType = target.tagName.toLowerCase();
        
        this.captureResourceError(resourceUrl, resourceType, {
          element: target.tagName,
          id: target.id,
          className: target.className,
        });
      }
    };
    
    // Capture resource loading errors (images, scripts, stylesheets)
    window.addEventListener('error', this.resourceErrorHandler, true);
  }

  // New method: Setup Performance Observer
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      // Observe long tasks (>50ms)
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            this.capturePerformanceIssue('long-task', {
              duration: entry.duration,
              name: entry.name,
              startTime: entry.startTime,
            });
          }
          
          // Resource timing
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 3000) { // Resources taking > 3 seconds
              this.capturePerformanceIssue('slow-resource', {
                url: resourceEntry.name,
                duration: resourceEntry.duration,
                transferSize: resourceEntry.transferSize,
                encodedBodySize: resourceEntry.encodedBodySize,
              });
            }
          }
          
          // Navigation timing for slow page loads
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            if (navEntry.loadEventEnd - navEntry.fetchStart > 5000) { // Page load > 5 seconds
              this.capturePerformanceIssue('slow-page-load', {
                loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart,
              });
            }
          }
        }
      });
      
      // Observe different performance metrics
      if (this.performanceObserver.observe) {
        // Observe long tasks
        try { this.performanceObserver.observe({ entryTypes: ['longtask'] }); } catch (e) {}
        // Observe resource timing
        try { this.performanceObserver.observe({ entryTypes: ['resource'] }); } catch (e) {}
        // Observe navigation timing
        try { this.performanceObserver.observe({ entryTypes: ['navigation'] }); } catch (e) {}
      }
      
      // Monitor memory usage if available
      if ((performance as any).memory) {
        setInterval(() => {
          const memory = (performance as any).memory;
          const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);
          const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
          
          // Alert if using > 90% of available memory
          if (usedMemoryMB / limitMB > 0.9) {
            this.capturePerformanceIssue('high-memory-usage', {
              usedMemoryMB: Math.round(usedMemoryMB),
              limitMB: Math.round(limitMB),
              percentage: Math.round((usedMemoryMB / limitMB) * 100),
            });
          }
        }, 30000); // Check every 30 seconds
      }
    } catch (error) {
      console.warn('Failed to setup performance observer:', error);
    }
  }

  // New method: Setup Security Handlers (CORS & CSP)
  private setupSecurityHandlers(): void {
    // Content Security Policy violations
    this.securityPolicyHandler = (event: SecurityPolicyViolationEvent) => {
      this.captureSecurityViolation('csp', {
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      });
    };
    
    window.addEventListener('securitypolicyviolation', this.securityPolicyHandler);
  }

  // New method: Setup Zod Error Handling
  private setupZodErrorHandling(): void {
    // This will be called by the application when using Zod
    (window as any).__captureZodError = (error: any, schema: string) => {
      this.captureValidationError(error, schema);
    };
  }

  // New method: Capture Resource Error
  public captureResourceError(url: string, resourceType: string, details?: any): void {
    const message = `Failed to load ${resourceType}: ${url}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'resource-loader',
        errorType: 'resource',
        resourceUrl: url,
        resourceType,
        ...details,
      },
      'error'
    );
  }

  // New method: Capture WebSocket Error
  public captureWebSocketError(error: any, details?: any): void {
    const message = error?.message || 'WebSocket connection error';
    
    this.captureError(
      error instanceof Error ? error : new Error(message),
      {
        component: 'websocket',
        errorType: 'websocket',
        ...details,
      },
      details?.reconnecting ? 'warning' : 'error'
    );
  }

  // New method: Capture Validation Error
  public captureValidationError(error: any, schema: string, details?: any): void {
    let message = 'Validation error';
    let validationDetails: any = {};
    
    // Handle Zod errors
    if (error?.issues) {
      const issues = error.issues.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      message = `Validation failed in ${schema}: ${issues.map((i: any) => i.message).join(', ')}`;
      validationDetails = { issues, schema };
    } else if (error?.message) {
      message = error.message;
      validationDetails = { schema, error: error.toString() };
    }
    
    this.captureError(
      error instanceof Error ? error : new Error(message),
      {
        component: 'validation',
        errorType: 'validation',
        validationDetails,
        ...details,
      },
      'warning'
    );
  }

  // New method: Capture Performance Issue
  public capturePerformanceIssue(issueType: string, metrics: any): void {
    const message = `Performance issue detected: ${issueType}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'performance',
        errorType: 'performance',
        issueType,
        performanceMetrics: metrics,
      },
      'warning'
    );
  }

  // New method: Capture Security Violation
  public captureSecurityViolation(violationType: string, details: any): void {
    const message = violationType === 'csp' 
      ? `CSP violation: ${details.violatedDirective}`
      : `Security violation: ${violationType}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'security',
        errorType: violationType === 'csp' ? 'csp' : 'cors',
        violationType,
        ...details,
      },
      'error'
    );
  }

  // New method: Hook into Socket.io errors
  public hookSocketErrors(socket: any): void {
    if (!socket || this.socketErrorHandlers.has(socket)) return;
    
    const errorHandler = () => {
      // Socket.io error events
      socket.on('connect_error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'connect_error',
          socketId: socket.id,
          reconnecting: socket.reconnecting,
        });
      });
      
      socket.on('connect_timeout', () => {
        this.captureWebSocketError(new Error('Socket connection timeout'), {
          event: 'connect_timeout',
          socketId: socket.id,
        });
      });
      
      socket.on('error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'error',
          socketId: socket.id,
        });
      });
      
      socket.on('reconnect_error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'reconnect_error',
          socketId: socket.id,
          reconnecting: true,
        });
      });
      
      socket.on('reconnect_failed', () => {
        this.captureWebSocketError(new Error('Socket reconnection failed'), {
          event: 'reconnect_failed',
          socketId: socket.id,
          severity: 'critical',
        });
      });
    };
    
    errorHandler();
    this.socketErrorHandlers.set(socket, errorHandler);
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  const tracker = ErrorTracker.getInstance();
  
  // Wrap global fetch
  if (tracker) {
    const originalFetch = window.fetch;
    window.fetch = tracker.wrapFetch(originalFetch);
  }
}

export default ErrorTracker;