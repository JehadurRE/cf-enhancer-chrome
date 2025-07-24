/**
 * Error Handling Utilities
 * @author JehadurRE
 */

class CFEnhancerErrorHandler {
  static logError(component, error, context = {}) {
    const errorInfo = {
      component,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    console.error(`[CF Enhancer] ${component} Error:`, errorInfo);
    
    // Store error for debugging (optional)
    this.storeError(errorInfo);
  }

  static async storeError(errorInfo) {
    try {
      const errors = await this.getStoredErrors();
      errors.push(errorInfo);
      
      // Keep only last 10 errors
      const recentErrors = errors.slice(-10);
      
      await CFEnhancerStorage.setOption('debug_errors', recentErrors);
    } catch (e) {
      // Silent fail for error storage
      console.warn('[CF Enhancer] Could not store error:', e);
    }
  }

  static async getStoredErrors() {
    try {
      return await CFEnhancerStorage.getOption('debug_errors', []);
    } catch (e) {
      return [];
    }
  }

  static async clearStoredErrors() {
    try {
      await CFEnhancerStorage.setOption('debug_errors', []);
      console.log('[CF Enhancer] Error log cleared');
    } catch (e) {
      console.warn('[CF Enhancer] Could not clear error log:', e);
    }
  }

  static wrapAsyncFunction(fn, component) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        CFEnhancerErrorHandler.logError(component, error, { 
          function: fn.name,
          arguments: args.length 
        });
        throw error;
      }
    };
  }

  static wrapFunction(fn, component) {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        CFEnhancerErrorHandler.logError(component, error, { 
          function: fn.name,
          arguments: args.length 
        });
        throw error;
      }
    };
  }
}

// Make available globally
window.CFEnhancerErrorHandler = CFEnhancerErrorHandler;
