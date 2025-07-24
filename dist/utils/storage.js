/**
 * Modern storage utility for Codeforces Enhancer
 * @author JehadurRE
 * Based on original work by agul
 */

class CFEnhancerStorage {
  /**
   * Set an option value in storage
   * @param {string} option - The option key
   * @param {any} value - The value to store
   * @returns {Promise<void>}
   */
  static async setOption(option, value) {
    try {
      console.log(`[CF Enhancer] Setting ${option} = ${value}`);
      const data = { [option]: value };
      await chrome.storage.local.set(data);
    } catch (error) {
      console.error(`[CF Enhancer] Error setting option ${option}:`, error);
    }
  }

  /**
   * Get an option value from storage
   * @param {string} option - The option key
   * @param {any} defaultValue - Default value if option doesn't exist
   * @returns {Promise<any>}
   */
  static async getOption(option, defaultValue = true) {
    try {
      const result = await chrome.storage.local.get([option]);
      let value = result[option];
      
      if (value === undefined || value === null) {
        console.log(`[CF Enhancer] Option ${option} not found, setting default: ${defaultValue}`);
        await this.setOption(option, defaultValue);
        value = defaultValue;
      }
      
      return value;
    } catch (error) {
      console.error(`[CF Enhancer] Error getting option ${option}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get multiple options at once
   * @param {string[]} options - Array of option keys
   * @param {any} defaultValue - Default value for missing options
   * @returns {Promise<Object>}
   */
  static async getOptions(options, defaultValue = true) {
    try {
      const result = await chrome.storage.local.get(options);
      const finalResult = {};
      
      for (const option of options) {
        if (result[option] === undefined || result[option] === null) {
          await this.setOption(option, defaultValue);
          finalResult[option] = defaultValue;
        } else {
          finalResult[option] = result[option];
        }
      }
      
      return finalResult;
    } catch (error) {
      console.error('[CF Enhancer] Error getting multiple options:', error);
      const fallbackResult = {};
      options.forEach(option => {
        fallbackResult[option] = defaultValue;
      });
      return fallbackResult;
    }
  }

  /**
   * Clear all stored options
   * @returns {Promise<void>}
   */
  static async clearAll() {
    try {
      await chrome.storage.local.clear();
      console.log('[CF Enhancer] All options cleared');
    } catch (error) {
      console.error('[CF Enhancer] Error clearing options:', error);
    }
  }
}

// Legacy support for old API (for backwards compatibility during transition)
function setOption(option, value) {
  return CFEnhancerStorage.setOption(option, value);
}

function getOption(option, callback) {
  CFEnhancerStorage.getOption(option).then(value => {
    if (callback && typeof callback === 'function') {
      callback(option, value);
    }
  });
}

// Make available globally for content scripts
window.CFEnhancerStorage = CFEnhancerStorage;
window.setOption = setOption;
window.getOption = getOption;
