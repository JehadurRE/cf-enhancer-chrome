/**
 * Options Page Script
 * @author JehadurRE
 * Based on original work by agul (https://github.com/agul/cf-enhancer)
 * 
 * Handles the modern options page functionality
 */

class OptionsPageManager {
  constructor() {
    this.options = {
      multiGraph: { element: null, value: true },
      colorizeStandings: { element: null, value: true },
      showAttempts: { element: null, value: true },
      hideSolved: { element: null, value: true },
      darkMode: { element: null, value: false },
      ratingPredictor: { element: null, value: true },
      recommendedQuestions: { element: null, value: true }
    };

    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      await this.setupElements();
      await this.loadStoredValues();
      this.setupEventListeners();
      this.updateDependentOptions();
      console.log('[CF Enhancer] Options page initialized successfully');
    } catch (error) {
      console.error('[CF Enhancer] Error initializing options page:', error);
      this.showStatus('Error loading options', 'error');
    }
  }

  /**
   * Setup DOM elements
   */
  async setupElements() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Get toggle elements
    this.options.multiGraph.element = document.getElementById('multiGraphToggle');
    this.options.colorizeStandings.element = document.getElementById('colorizeStandingsToggle');
    this.options.showAttempts.element = document.getElementById('showAttemptsToggle');
    this.options.hideSolved.element = document.getElementById('hideSolvedToggle');
    this.options.darkMode.element = document.getElementById('darkModeToggle');
    this.options.ratingPredictor.element = document.getElementById('ratingPredictorToggle');
    this.options.recommendedQuestions.element = document.getElementById('recommendedQuestionsToggle');

    // Verify all elements exist
    for (const [key, option] of Object.entries(this.options)) {
      if (!option.element) {
        throw new Error(`Element not found for option: ${key}`);
      }
    }

    // Get other elements
    this.resetButton = document.getElementById('resetButton');
    this.statusMessage = document.getElementById('statusMessage');
    this.showAttemptsOption = document.getElementById('showAttemptsOption');

    if (!this.resetButton || !this.statusMessage || !this.showAttemptsOption) {
      throw new Error('Required UI elements not found');
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
        if (this.options[key]) {
          this.options[key].value = value;
          this.updateToggleUI(this.options[key].element, value);
        }
      }
    } catch (error) {
      console.error('[CF Enhancer] Error loading stored values:', error);
      throw error;
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
      option.element.addEventListener('click', () => {
        this.toggleOption(key);
      });

      // Also handle label clicks
      const label = option.element.nextElementSibling;
      if (label && label.classList.contains('toggle-label')) {
        label.addEventListener('click', () => {
          this.toggleOption(key);
        });
      }
    }

    // Reset button
    this.resetButton.addEventListener('click', () => {
      this.resetAllOptions();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'r' && !e.shiftKey) {
          e.preventDefault();
          this.resetAllOptions();
        }
      }
    });
  }

  /**
   * Toggle an option
   * @param {string} optionKey - The option to toggle
   */
  async toggleOption(optionKey) {
    try {
      const option = this.options[optionKey];
      if (!option) return;

      const newValue = !option.value;
      option.value = newValue;

      // Update UI
      this.updateToggleUI(option.element, newValue);
      
      // Save to storage
      await this.saveOption(optionKey, newValue);
      
      // Update dependent options
      this.updateDependentOptions();
      
      // Show success message
      this.showStatus('Settings saved', 'success');

      console.log(`[CF Enhancer] Option ${optionKey} set to ${newValue}`);
    } catch (error) {
      console.error(`[CF Enhancer] Error toggling option ${optionKey}:`, error);
      this.showStatus('Error saving settings', 'error');
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
   * Update dependent options (e.g., showAttempts depends on colorizeStandings)
   */
  updateDependentOptions() {
    const colorizeEnabled = this.options.colorizeStandings.value;
    
    if (colorizeEnabled) {
      this.showAttemptsOption.classList.remove('disabled');
    } else {
      this.showAttemptsOption.classList.add('disabled');
      
      // If colorize is disabled, also disable show attempts
      if (this.options.showAttempts.value) {
        this.toggleOption('showAttempts');
      }
    }
  }

  /**
   * Reset all options to defaults
   */
  async resetAllOptions() {
    try {
      // Create a custom confirmation dialog instead of using confirm()
      const shouldReset = await this.showConfirmDialog(
        'Reset Settings',
        'Are you sure you want to reset all settings to their default values?'
      );

      if (!shouldReset) return;

      // Clear storage
      await this.clearStorage();

      // Reset all options to default (true)
      for (const [key, option] of Object.entries(this.options)) {
        option.value = true;
        this.updateToggleUI(option.element, true);
        await this.saveOption(key, true);
      }

      // Update UI
      this.updateDependentOptions();
      this.showStatus('All settings reset to defaults', 'success');

      console.log('[CF Enhancer] All options reset to defaults');
    } catch (error) {
      console.error('[CF Enhancer] Error resetting options:', error);
      this.showStatus('Error resetting settings', 'error');
    }
  }

  /**
   * Show custom confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @returns {Promise<boolean>} User's choice
   */
  async showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Create dialog
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        text-align: center;
      `;

      dialog.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #2c3e50;">${title}</h3>
        <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">${message}</p>
        <div>
          <button id="confirmCancel" style="
            padding: 10px 20px;
            margin-right: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            cursor: pointer;
          ">Cancel</button>
          <button id="confirmOk" style="
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            background: #dc3545;
            color: white;
            cursor: pointer;
          ">Reset All</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Handle button clicks
      const handleChoice = (choice) => {
        document.body.removeChild(overlay);
        resolve(choice);
      };

      dialog.querySelector('#confirmOk').addEventListener('click', () => handleChoice(true));
      dialog.querySelector('#confirmCancel').addEventListener('click', () => handleChoice(false));
      
      // Handle escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escapeHandler);
          handleChoice(false);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Handle overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleChoice(false);
        }
      });
    });
  }

  /**
   * Clear storage
   */
  async clearStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Show status message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   */
  showStatus(message, type = 'success') {
    if (!this.statusMessage) return;

    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    
    // Show message
    setTimeout(() => {
      this.statusMessage.classList.add('show');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
      this.statusMessage.classList.remove('show');
    }, 3000);
  }

  /**
   * Export settings as JSON
   */
  async exportSettings() {
    try {
      const settings = {};
      for (const [key, option] of Object.entries(this.options)) {
        settings[key] = option.value;
      }

      const settingsJson = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'cf-enhancer-settings.json';
      a.click();

      URL.revokeObjectURL(url);
      this.showStatus('Settings exported successfully', 'success');
    } catch (error) {
      console.error('[CF Enhancer] Error exporting settings:', error);
      this.showStatus('Error exporting settings', 'error');
    }
  }

  /**
   * Import settings from JSON
   * @param {File} file - JSON file to import
   */
  async importSettings(file) {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);

      for (const [key, value] of Object.entries(settings)) {
        if (this.options[key] && typeof value === 'boolean') {
          this.options[key].value = value;
          this.updateToggleUI(this.options[key].element, value);
          await this.saveOption(key, value);
        }
      }

      this.updateDependentOptions();
      this.showStatus('Settings imported successfully', 'success');
    } catch (error) {
      console.error('[CF Enhancer] Error importing settings:', error);
      this.showStatus('Error importing settings', 'error');
    }
  }
}

// Initialize options page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptionsPageManager();
  });
} else {
  new OptionsPageManager();
}