/**
 * Popup Script for Quick Settings
 * @author JehadurRE
 * Based on original work by agul (https://github.com/agul/cf-enhancer)
 */

class PopupManager {
  constructor() {
    this.options = {
      multiGraph: { element: null, value: true },
      colorizeStandings: { element: null, value: true },
      showAttempts: { element: null, value: true },
      hideSolved: { element: null, value: true }
    };

    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      this.setupElements();
      await this.loadStoredValues();
      this.setupEventListeners();
      console.log('[CF Enhancer] Popup initialized successfully');
    } catch (error) {
      console.error('[CF Enhancer] Error initializing popup:', error);
    }
  }

  /**
   * Setup DOM elements
   */
  setupElements() {
    this.options.multiGraph.element = document.getElementById('popupMultiGraph');
    this.options.colorizeStandings.element = document.getElementById('popupColorizeStandings');
    this.options.showAttempts.element = document.getElementById('popupShowAttempts');
    this.options.hideSolved.element = document.getElementById('popupHideSolved');

    this.openFullOptionsButton = document.getElementById('openFullOptions');
    this.statusIndicator = document.getElementById('statusIndicator');

    // Verify all elements exist
    for (const [key, option] of Object.entries(this.options)) {
      if (!option.element) {
        console.error(`[CF Enhancer] Element not found for option: ${key}`);
      }
    }
  }

  /**
   * Load stored values from storage
   */
  async loadStoredValues() {
    try {
      const optionKeys = Object.keys(this.options);
      const storedOptions = await this.getStorageOptions(optionKeys);

      for (const [key, value] of Object.entries(storedOptions)) {
        if (this.options[key] && this.options[key].element) {
          this.options[key].value = value;
          this.updateToggleUI(this.options[key].element, value);
        }
      }
    } catch (error) {
      console.error('[CF Enhancer] Error loading stored values:', error);
    }
  }

  /**
   * Get options from storage
   * @param {string[]} keys - Option keys to retrieve
   * @returns {Promise<Object>} Stored options
   */
  async getStorageOptions(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        // Set defaults for missing values
        const finalResult = {};
        for (const key of keys) {
          finalResult[key] = result[key] !== undefined ? result[key] : true;
        }

        resolve(finalResult);
      });
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle switches
    for (const [key, option] of Object.entries(this.options)) {
      if (option.element) {
        option.element.addEventListener('click', () => {
          this.toggleOption(key);
        });
      }
    }

    // Open full options page
    if (this.openFullOptionsButton) {
      this.openFullOptionsButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.openFullOptions();
      });
    }
  }

  /**
   * Toggle an option
   * @param {string} optionKey - The option to toggle
   */
  async toggleOption(optionKey) {
    try {
      const option = this.options[optionKey];
      if (!option || !option.element) return;

      const newValue = !option.value;
      option.value = newValue;

      // Update UI
      this.updateToggleUI(option.element, newValue);
      
      // Save to storage
      await this.saveOption(optionKey, newValue);
      
      // Show success indicator
      this.showSuccess();

      console.log(`[CF Enhancer] Option ${optionKey} set to ${newValue}`);
    } catch (error) {
      console.error(`[CF Enhancer] Error toggling option ${optionKey}:`, error);
    }
  }

  /**
   * Save an option to storage
   * @param {string} key - Option key
   * @param {any} value - Option value
   */
  async saveOption(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update toggle UI
   * @param {HTMLElement} element - Toggle element
   * @param {boolean} isActive - Whether toggle is active
   */
  updateToggleUI(element, isActive) {
    if (isActive) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  }

  /**
   * Show success indicator
   */
  showSuccess() {
    if (this.statusIndicator) {
      this.statusIndicator.classList.add('show');
      setTimeout(() => {
        this.statusIndicator.classList.remove('show');
      }, 1000);
    }
  }

  /**
   * Open full options page
   */
  openFullOptions() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
