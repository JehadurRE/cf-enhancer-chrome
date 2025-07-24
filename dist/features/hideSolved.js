/**
 * Hide Solved Problems Feature
 * @author JehadurRE
 * Based on original work by agul (https://github.com/agul/cf-enhancer)
 * 
 * Adds toggle functionality to hide/show solved problems in problemset
 */

class HideSolvedFeature {
  constructor() {
    this.toggleLink = null;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      const isEnabled = await CFEnhancerStorage.getOption("hideSolved", true);
      if (isEnabled && !this.isInitialized) {
        this.setupHideSolved();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing HideSolved:', error);
    }
  }

  /**
   * Setup hide/show solved problems functionality
   */
  setupHideSolved() {
    // Wait for document ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createToggleLink());
    } else {
      this.createToggleLink();
    }
  }

  /**
   * Create and add the toggle link to the page
   */
  createToggleLink() {
    try {
      // Find the container where we want to add the toggle link
      const searchBlock = document.querySelector('.closed');
      if (!searchBlock || !searchBlock.parentNode) {
        console.warn('[CF Enhancer] Could not find search block to add toggle link');
        return;
      }

      // Create toggle link element
      this.toggleLink = this.createStyledToggleLink();
      
      // Insert the toggle link before the search block
      searchBlock.parentNode.insertBefore(this.toggleLink, searchBlock);
      
      console.log('[CF Enhancer] Hide/Show solved problems toggle added successfully');
    } catch (error) {
      console.error('[CF Enhancer] Error creating toggle link:', error);
    }
  }

  /**
   * Create a styled toggle link element
   * @returns {HTMLElement} Toggle link element
   */
  createStyledToggleLink() {
    const link = document.createElement('a');
    link.href = '#';
    link.innerHTML = 'Hide solved problems';
    link.className = 'cf-enhancer-toggle-link';
    
    // Add modern styling
    Object.assign(link.style, {
      display: 'inline-block',
      padding: '8px 16px',
      margin: '10px 0',
      backgroundColor: '#007bff',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      border: 'none',
      cursor: 'pointer'
    });

    // Add hover effects
    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#0056b3';
    });

    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = '#007bff';
    });

    // Add click handler
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleSolvedProblems();
    });

    return link;
  }

  /**
   * Toggle visibility of solved problems
   */
  toggleSolvedProblems() {
    try {
      const solvedProblems = document.querySelectorAll('.accepted-problem');
      
      if (solvedProblems.length === 0) {
        console.warn('[CF Enhancer] No solved problems found');
        return;
      }

      // Determine current visibility state
      const isCurrentlyHidden = solvedProblems[0].style.display === 'none';
      const newDisplayState = isCurrentlyHidden ? 'table-row' : 'none';
      const newLinkText = isCurrentlyHidden ? 'Hide solved problems' : 'Show solved problems';

      // Update all solved problem rows
      solvedProblems.forEach(element => {
        element.style.display = newDisplayState;
      });

      // Update toggle link text
      if (this.toggleLink) {
        this.toggleLink.innerHTML = newLinkText;
        
        // Update styling based on state
        if (isCurrentlyHidden) {
          this.toggleLink.style.backgroundColor = '#007bff';
        } else {
          this.toggleLink.style.backgroundColor = '#28a745';
        }
      }

      // Log action for debugging
      const action = isCurrentlyHidden ? 'shown' : 'hidden';
      console.log(`[CF Enhancer] Solved problems ${action} (${solvedProblems.length} problems affected)`);
      
      // Store preference
      this.storeTogglePreference(!isCurrentlyHidden);
      
    } catch (error) {
      console.error('[CF Enhancer] Error toggling solved problems:', error);
    }
  }

  /**
   * Store user's toggle preference
   * @param {boolean} isHidden - Whether problems are currently hidden
   */
  async storeTogglePreference(isHidden) {
    try {
      await CFEnhancerStorage.setOption('problemsCurrentlyHidden', isHidden);
    } catch (error) {
      console.error('[CF Enhancer] Error storing toggle preference:', error);
    }
  }

  /**
   * Restore previous toggle state
   */
  async restorePreviousState() {
    try {
      const wasHidden = await CFEnhancerStorage.getOption('problemsCurrentlyHidden', false);
      if (wasHidden) {
        // Small delay to ensure DOM is ready
        setTimeout(() => this.toggleSolvedProblems(), 100);
      }
    } catch (error) {
      console.error('[CF Enhancer] Error restoring previous state:', error);
    }
  }

  /**
   * Get count of solved problems
   * @returns {number} Number of solved problems
   */
  getSolvedProblemsCount() {
    return document.querySelectorAll('.accepted-problem').length;
  }

  /**
   * Add keyboard shortcut support
   */
  addKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + H to toggle solved problems
      if ((e.ctrlKey || e.metaKey) && e.key === 'h' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.toggleSolvedProblems();
      }
    });
  }

  /**
   * Enhanced setup with additional features
   */
  enhancedSetup() {
    this.setupHideSolved();
    this.addKeyboardShortcut();
    this.restorePreviousState();
    
    // Add statistics display
    this.addSolvedProblemsCounter();
  }

  /**
   * Add a counter showing number of solved problems
   */
  addSolvedProblemsCounter() {
    try {
      const count = this.getSolvedProblemsCount();
      if (count > 0 && this.toggleLink) {
        const counter = document.createElement('span');
        counter.className = 'cf-enhancer-solved-counter';
        counter.innerHTML = ` (${count} solved)`;
        counter.style.fontWeight = 'normal';
        counter.style.opacity = '0.8';
        this.toggleLink.appendChild(counter);
      }
    } catch (error) {
      console.error('[CF Enhancer] Error adding solved problems counter:', error);
    }
  }
}

// Initialize when script loads
if (window.location.href.includes('/problemset')) {
  const hideSolvedFeature = new HideSolvedFeature();
  
  // Use enhanced setup for better user experience
  document.addEventListener('DOMContentLoaded', () => {
    hideSolvedFeature.enhancedSetup();
  });
}
