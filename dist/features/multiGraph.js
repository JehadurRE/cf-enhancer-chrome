/**
 * Multi-Account Rating Graph Feature
 * @author JehadurRE
 * Based on original work by agul (https://github.com/agul/cf-enhancer)
 * 
 * Allows users to view multiple Codeforces accounts' rating graphs simultaneously
 */

class MultiGraphFeature {
  constructor() {
    this.isInitialized = false;
    this.isGraphEnhanced = false;
    this.init();
  }

  async init() {
    try {
      // Add diagnostic information
      this.logDiagnostics();
      
      // Only initialize if we should have a graph on this page
      if (!this.shouldHaveGraph()) {
        console.log('[CF Enhancer] Page does not have a rating graph, skipping multi-graph feature');
        return;
      }

      const isEnabled = await CFEnhancerStorage.getOption("multiGraph", true);
      if (isEnabled && !this.isInitialized) {
        console.log('[CF Enhancer] Initializing Multi-Graph feature (jQuery-free)...');
        
        // Store reference for global access
        window.cfEnhancerMultiGraph = this;
        
        // Skip jQuery entirely - use modern vanilla JS approach
        this.setupModernGraphDetection();
        
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing MultiGraph:', error);
    }
  }

  /**
   * Log diagnostic information about the page
   */
  logDiagnostics() {
    console.log('[CF Enhancer] Page diagnostics (modern):', {
      url: window.location.href,
      readyState: document.readyState,
      hasPlaceholder: !!document.getElementById('placeholder'),
      hasUsersRatingGraphPlaceholder: !!document.getElementById('usersRatingGraphPlaceholder'),
      hasPageContent: !!document.getElementById('pageContent'),
      hasCanvas: !!document.querySelector('#placeholder canvas, #usersRatingGraphPlaceholder canvas'),
      hasLegend: !!document.querySelector('#placeholder .legend, #usersRatingGraphPlaceholder .legend'),
      placeholderChildren: document.getElementById('placeholder')?.children.length || 0,
      usersRatingGraphChildren: document.getElementById('usersRatingGraphPlaceholder')?.children.length || 0,
      availableGlobals: {
        '$': typeof window.$,
        'jQuery': typeof window.jQuery,
        'plot': typeof window.plot
      },
      scripts: Array.from(document.querySelectorAll('script')).length,
      hasGraphScript: this.hasGraphScript()
    });
  }

  /**
   * Modern graph detection without jQuery dependency
   */
  setupModernGraphDetection() {
    console.log('[CF Enhancer] Setting up modern graph detection (no jQuery needed)...');
    
    // Strategy 1: Check immediately
    if (this.detectAndEnhanceGraph()) return;

    // Strategy 2: Wait a moment for any remaining content
    setTimeout(() => {
      if (this.detectAndEnhanceGraph()) return;
    }, 500);

    // Strategy 3: Use MutationObserver for dynamic content
    this.observeForGraph();

    // Strategy 4: Periodic check as backup
    this.startPeriodicGraphCheck();
  }

  /**
   * Detect and enhance graph if present
   * @returns {boolean} True if graph was detected and enhanced
   */
  detectAndEnhanceGraph() {
    if (this.isGraphEnhanced) return true;

    // Look for both possible placeholder IDs
    let placeholder = document.getElementById('placeholder');
    if (!placeholder) {
      placeholder = document.getElementById('usersRatingGraphPlaceholder');
    }
    
    if (!placeholder) {
      console.log('[CF Enhancer] No placeholder element found (checked both "placeholder" and "usersRatingGraphPlaceholder")');
      return false;
    }

    const canvas = placeholder.querySelector('canvas');
    const legend = placeholder.querySelector('.legend, .legendLayer, [class*="legend"]');
    const hasGraphScript = this.hasGraphScript();
    const hasChildren = placeholder.children.length > 0;

    console.log('[CF Enhancer] Graph detection result:', {
      placeholderId: placeholder.id,
      hasPlaceholder: !!placeholder,
      hasCanvas: !!canvas,
      hasLegend: !!legend,
      hasGraphScript: hasGraphScript,
      placeholderChildren: placeholder.children.length,
      readyToEnhance: !!(canvas || legend || hasGraphScript || hasChildren)
    });

    if (canvas || legend || hasGraphScript || hasChildren) {
      this.enhanceGraphModern(placeholder);
      return true;
    }

    return false;
  }

  /**
   * Observe for graph elements being added
   */
  observeForGraph() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.id === 'placeholder' || node.id === 'usersRatingGraphPlaceholder' ||
                  (node.querySelector && (node.querySelector('#placeholder') || node.querySelector('#usersRatingGraphPlaceholder')))) {
                console.log(`[CF Enhancer] Placeholder detected via mutation observer: ${node.id || 'child element'}`);
                setTimeout(() => this.detectAndEnhanceGraph(), 100);
              }
              if (node.tagName === 'CANVAS' || 
                  (node.querySelector && node.querySelector('canvas'))) {
                console.log('[CF Enhancer] Canvas detected via mutation observer');
                setTimeout(() => this.detectAndEnhanceGraph(), 100);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Stop observing after 10 seconds
    setTimeout(() => {
      observer.disconnect();
      console.log('[CF Enhancer] Stopped mutation observer');
    }, 10000);
  }

  /**
   * Start periodic checking for graph
   */
  startPeriodicGraphCheck() {
    let attempts = 0;
    const maxAttempts = 30; // 6 seconds
    
    const checkInterval = setInterval(() => {
      attempts++;
      console.log(`[CF Enhancer] Periodic check attempt ${attempts}/${maxAttempts}`);
      
      if (this.detectAndEnhanceGraph()) {
        console.log('[CF Enhancer] Graph detected via periodic check');
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        console.log('[CF Enhancer] Giving up on periodic checks');
        
        // Final diagnostic check
        const placeholder = document.getElementById('placeholder');
        const usersRatingGraphPlaceholder = document.getElementById('usersRatingGraphPlaceholder');
        const pageText = document.body.textContent || '';
        const hasNoRatingIndications = pageText.includes('no contests') || 
                                     pageText.includes('No contests') || 
                                     pageText.includes('no rating') ||
                                     pageText.includes('No rating') ||
                                     pageText.includes('not participated') ||
                                     pageText.includes('no data');
        
        console.log('[CF Enhancer] Final diagnostic:', {
          hasPlaceholder: !!placeholder,
          hasUsersRatingGraphPlaceholder: !!usersRatingGraphPlaceholder,
          hasNoRatingIndications: hasNoRatingIndications,
          graphTypeInUrl: window.location.href.includes('graphType'),
          pageTextSnippet: pageText.substring(0, 200) + '...'
        });
        
        if (hasNoRatingIndications) {
          console.log('[CF Enhancer] User appears to have no rating data - this is normal behavior');
        } else {
          console.log('[CF Enhancer] Graph may load via AJAX later or page structure may be different');
        }
        
        clearInterval(checkInterval);
      }
    }, 200);
  }

  /**
   * Enhance graph using modern vanilla JavaScript
   */
  enhanceGraphModern(placeholder) {
    if (this.isGraphEnhanced) {
      console.log('[CF Enhancer] Graph already enhanced');
      return;
    }

    // Find the best element to attach click handler to
    let targetElement = placeholder.querySelector('.legend');
    if (!targetElement) {
      targetElement = placeholder.querySelector('.legendLayer');
    }
    if (!targetElement) {
      targetElement = placeholder.querySelector('[class*="legend"]');
    }
    if (!targetElement) {
      // If no legend found, use the entire placeholder
      targetElement = placeholder;
      console.log('[CF Enhancer] No legend found, using entire placeholder');
    }

    console.log('[CF Enhancer] Target element for enhancement:', {
      tagName: targetElement.tagName,
      className: targetElement.className,
      id: targetElement.id,
      dimensions: {
        width: targetElement.offsetWidth,
        height: targetElement.offsetHeight
      }
    });

    // Add click handler
    targetElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showModernAccountDialog();
    });

    // Add visual feedback
    targetElement.style.cursor = 'pointer';
    targetElement.style.userSelect = 'none';
    targetElement.title = 'Click to compare with other accounts (CF Enhancer)';

    // Always add a clear, visible indicator regardless of element type
    const container = targetElement !== placeholder ? targetElement.parentElement || placeholder : placeholder;
    container.style.position = 'relative';
    
    // Create a prominent overlay badge
    const badge = document.createElement('div');
    badge.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
      ">
        📊 Compare Graphs
      </div>
    `;
    
    badge.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(4px);
      min-width: 120px;
      text-align: center;
    `;
    
    badge.title = 'Click to compare with other accounts (CF Enhancer)';
    
    // Add click handler to badge
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showModernAccountDialog();
    });
    
    // Add hover effects to badge
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.05) translateY(-2px)';
      badge.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
      badge.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)';
    });
    
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1) translateY(0)';
      badge.style.boxShadow = '0 2px 12px rgba(102, 126, 234, 0.4)';
      badge.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    });
    
    container.appendChild(badge);
    
    // Also add subtle styling to the target element for additional feedback
    if (targetElement !== placeholder) {
      targetElement.style.outline = '1px dashed rgba(102, 126, 234, 0.3)';
      targetElement.style.outlineOffset = '2px';
      
      targetElement.addEventListener('mouseenter', () => {
        targetElement.style.outline = '2px dashed rgba(102, 126, 234, 0.6)';
      });
      
      targetElement.addEventListener('mouseleave', () => {
        targetElement.style.outline = '1px dashed rgba(102, 126, 234, 0.3)';
      });
    }

    this.isGraphEnhanced = true;
    console.log('[CF Enhancer] Multi-graph feature enhanced successfully (modern JS)');
  }

  /**
   * Show modern account dialog
   */
  showModernAccountDialog() {
    console.log('[CF Enhancer] Showing modern account dialog');
    
    // Remove existing dialog
    this.removeModernDialog();

    const currentHandle = window.location.pathname.split('/').pop();
    
    // Create modern dialog
    const dialogHTML = `
      <div id="cf-enhancer-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
      ">
        <div id="cf-enhancer-dialog" style="
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          width: 90%;
          max-width: 500px;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            text-align: center;
          ">
            <h2 style="margin: 0; font-size: 22px; font-weight: 600;">
              📊 Multi-Account Graph Comparison
            </h2>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">
              Current: <strong>${currentHandle}</strong>
            </p>
          </div>
          
          <div style="padding: 28px;">
            <label style="
              display: block;
              margin-bottom: 12px;
              font-weight: 600;
              color: #333;
              font-size: 15px;
            ">
              🏆 Enter usernames to compare (space-separated):
            </label>
            
            <input type="text" id="cf-enhancer-accounts" 
                   placeholder="tourist Petr Endagorion rng_58"
                   style="
                     width: 100%;
                     padding: 14px;
                     border: 2px solid #e1e5e9;
                     border-radius: 8px;
                     font-size: 15px;
                     box-sizing: border-box;
                     transition: all 0.3s ease;
                     font-family: inherit;
                   "
                   onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                   onblur="this.style.borderColor='#e1e5e9'; this.style.boxShadow='none'">
            
            <div style="
              margin-top: 24px;
              display: flex;
              gap: 12px;
              justify-content: flex-end;
            ">
              <button type="button" id="cf-enhancer-cancel" style="
                padding: 12px 24px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                background: white;
                color: #666;
                cursor: pointer;
                font-size: 15px;
                font-weight: 500;
                transition: all 0.3s ease;
                font-family: inherit;
              ">Cancel</button>
              
              <button type="button" id="cf-enhancer-compare" style="
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: all 0.3s ease;
                font-family: inherit;
              ">🚀 Compare Graphs</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add CSS animation
    if (!document.getElementById('cf-enhancer-styles')) {
      const style = document.createElement('style');
      style.id = 'cf-enhancer-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        #cf-enhancer-cancel:hover {
          background: #f8f9fa !important;
          border-color: #667eea !important;
        }
        #cf-enhancer-compare:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
        }
        /* Glass effect hover states for dropdowns */
        #cf-time-filter:hover,
        #cf-rating-filter:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(102, 126, 234, 0.5) !important;
          box-shadow: 
            0 4px 12px rgba(102, 126, 234, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
        }
        #cf-time-filter:focus,
        #cf-rating-filter:focus {
          outline: none !important;
          background: rgba(255, 255, 255, 0.25) !important;
          border-color: rgba(102, 126, 234, 0.7) !important;
          box-shadow: 
            0 0 0 3px rgba(102, 126, 234, 0.2),
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
        }
        /* Glass effect for date inputs */
        #cf-date-from:hover,
        #cf-date-to:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          border-color: rgba(102, 126, 234, 0.5) !important;
        }
        #cf-date-from:focus,
        #cf-date-to:focus {
          outline: none !important;
          background: rgba(255, 255, 255, 0.4) !important;
          border-color: rgba(102, 126, 234, 0.7) !important;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
        }
        /* Glass button hover effects */
        #cf-apply-filters:hover {
          transform: translateY(-1px) !important;
          box-shadow: 
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
        }
        #cf-reset-filters:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(102, 126, 234, 0.5) !important;
        }
        /* Checkbox label hover effects */
        label:has(input[type="checkbox"]):hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(102, 126, 234, 0.5) !important;
          transform: scale(1.02) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Add to page
    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    // Get elements and add event handlers
    const overlay = document.getElementById('cf-enhancer-overlay');
    const input = document.getElementById('cf-enhancer-accounts');
    const cancelBtn = document.getElementById('cf-enhancer-cancel');
    const compareBtn = document.getElementById('cf-enhancer-compare');

    cancelBtn.addEventListener('click', () => this.removeModernDialog());
    
    compareBtn.addEventListener('click', () => {
      const accounts = input.value.trim();
      this.removeModernDialog();
      if (accounts) {
        this.handleAccountComparison(accounts);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.removeModernDialog();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        compareBtn.click();
      } else if (e.key === 'Escape') {
        this.removeModernDialog();
      }
    });

    // Focus input with slight delay
    setTimeout(() => input.focus(), 100);
  }

  /**
   * Handle account comparison - fetch and display real data
   * @param {string} accounts - Space-separated account names
   */
  async handleAccountComparison(accounts) {
    console.log('[CF Enhancer] Starting account comparison:', accounts);
    
    try {
      const accountList = accounts.split(' ').filter(acc => acc.trim());
      const currentHandle = window.location.pathname.split('/').pop();
      const allAccounts = [currentHandle, ...accountList];
      
      // Show loading message
      this.showLoadingMessage(allAccounts);
      
      // Fetch rating data for all accounts
      const accountData = await this.fetchMultipleAccountData(allAccounts);
      
      // Filter out accounts with no data
      const validAccounts = accountData.filter(data => data.contests && data.contests.length > 0);
      
      if (validAccounts.length === 0) {
        this.showErrorMessage('❌ No contest data found for any of the specified accounts.');
        return;
      }
      
      // Create and display the comparison graph
      this.displayComparisonGraph(validAccounts);
      
    } catch (error) {
      this.showErrorMessage('❌ Error fetching account data. Please check the usernames and try again.');
      console.error('[CF Enhancer] Comparison error:', error);
    }
  }

  /**
   * Show loading message while fetching data
   * @param {string[]} accounts - List of account names
   */
  showLoadingMessage(accounts) {
    this.removeModernDialog();
    
    const loadingHTML = `
      <div id="cf-enhancer-loading" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 40px;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        min-width: 300px;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px auto;
        "></div>
        <h3 style="margin: 0 0 16px 0; color: #333;">🔄 Fetching Rating Data</h3>
        <p style="color: #666; margin-bottom: 16px;">Loading data for:</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
          ${accounts.map(acc => `
            <span style="
              display: inline-block;
              background: #e9ecef;
              color: #333;
              padding: 4px 8px;
              border-radius: 12px;
              margin: 2px;
              font-size: 12px;
            ">${acc}</span>
          `).join('')}
        </div>
        <p style="color: #888; font-size: 14px; margin-top: 16px;">
          This may take a few seconds...
        </p>
      </div>
    `;
    
    // Add spinner animation if not already added
    if (!document.getElementById('cf-enhancer-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'cf-enhancer-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
  }

  /**
   * Fetch rating data for multiple accounts
   * @param {string[]} accounts - List of account names
   * @returns {Promise<Array>} Array of account data objects
   */
  async fetchMultipleAccountData(accounts) {
    const promises = accounts.map(async (handle) => {
      try {
        console.log(`[CF Enhancer] Fetching data for ${handle}...`);
        const response = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
        
        if (!response.ok) {
          console.warn(`[CF Enhancer] Failed to fetch data for ${handle}:`, response.status);
          return { handle, contests: [], error: `HTTP ${response.status}` };
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
          console.warn(`[CF Enhancer] API error for ${handle}:`, data.comment);
          return { handle, contests: [], error: data.comment || 'API Error' };
        }
        
        console.log(`[CF Enhancer] Successfully fetched ${data.result.length} contests for ${handle}`);
        return { handle, contests: data.result, error: null };
        
      } catch (error) {
        console.error(`[CF Enhancer] Error fetching data for ${handle}:`, error);
        return { handle, contests: [], error: error.message };
      }
    });
    
    return Promise.all(promises);
  }

  /**
   * Display comparison graph with multiple accounts
   * @param {Array} accountData - Array of account data objects
   */
  displayComparisonGraph(accountData) {
    this.removeModernDialog();
    
    // Generate colors for each account
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    // Prepare graph data
    const series = accountData.map((account, index) => {
      const points = account.contests.map(contest => [
        contest.ratingUpdateTimeSeconds * 1000, // Convert to milliseconds
        contest.newRating
      ]);
      
      return {
        label: account.handle,
        data: points,
        color: colors[index % colors.length],
        lines: { show: true, lineWidth: 2 },
        points: { show: true, radius: 3 }
      };
    });
    
    const graphHTML = `
      <div id="cf-enhancer-graph-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
      ">
        <div id="cf-enhancer-graph-container" style="
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          box-shadow: 
            0 8px 32px rgba(102, 126, 234, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          width: 95%;
          max-width: 1200px;
          height: 90%;
          max-height: 800px;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            flex-shrink: 0;
            position: relative;
          ">
            <button onclick="document.getElementById('cf-enhancer-graph-overlay').remove()" style="
              position: absolute;
              top: 15px;
              right: 15px;
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              color: white;
              cursor: pointer;
              font-size: 18px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
              box-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            " 
            onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.1)'"
            onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'"
            title="Close Comparison">×</button>
            <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
              📊 Multi-Account Rating Comparison
            </h2>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
              Comparing ${accountData.length} account${accountData.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; min-height: 0; overflow-y: auto;">
            <!-- Filter Controls -->
            <div style="
              background: rgba(248, 249, 250, 0.1);
              backdrop-filter: blur(30px);
              -webkit-backdrop-filter: blur(30px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
              flex-shrink: 0;
              box-shadow: 
                0 4px 16px rgba(102, 126, 234, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
            ">
              <div style="
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
              ">
                <h4 style="margin: 0; color: #333; font-size: 14px; font-weight: 600;">
                  🔍 Filters & Options
                </h4>
                <button id="cf-reset-filters" style="
                  padding: 6px 12px;
                  background: rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(10px);
                  -webkit-backdrop-filter: blur(10px);
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 6px;
                  color: #333;
                  cursor: pointer;
                  font-size: 12px;
                  box-shadow: 
                    0 2px 8px rgba(102, 126, 234, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4);
                  transition: all 0.3s ease;
                ">Reset All</button>
              </div>
              
              <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                align-items: end;
              ">
                <!-- Time Range Filter -->
                <div>
                  <label style="display: block; font-size: 12px; color: #333; margin-bottom: 4px;">
                    📅 Time Range
                  </label>
                  <select id="cf-time-filter" style="
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    font-size: 12px;
                    color: #333;
                    box-shadow: 
                      0 2px 8px rgba(102, 126, 234, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    transition: all 0.3s ease;
                  ">
                    <option value="all">All Time</option>
                    <option value="1y">Last Year</option>
                    <option value="2y">Last 2 Years</option>
                    <option value="3y">Last 3 Years</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  <!-- Custom Date Range Inputs (hidden by default) -->
                  <div id="cf-custom-date-range" style="
                    display: none;
                    margin-top: 6px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    box-shadow: 
                      0 2px 8px rgba(102, 126, 234, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
                  ">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                      <div>
                        <label style="display: block; font-size: 10px; color: #666; margin-bottom: 2px;">From:</label>
                        <input type="date" id="cf-date-from" style="
                          width: 100%;
                          padding: 4px;
                          background: rgba(255, 255, 255, 0.2);
                          backdrop-filter: blur(5px);
                          -webkit-backdrop-filter: blur(5px);
                          border: 1px solid rgba(255, 255, 255, 0.4);
                          border-radius: 4px;
                          font-size: 10px;
                          color: #333;
                          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                          transition: all 0.3s ease;
                        ">
                      </div>
                      <div>
                        <label style="display: block; font-size: 10px; color: #666; margin-bottom: 2px;">To:</label>
                        <input type="date" id="cf-date-to" style="
                          width: 100%;
                          padding: 4px;
                          background: rgba(255, 255, 255, 0.2);
                          backdrop-filter: blur(5px);
                          -webkit-backdrop-filter: blur(5px);
                          border: 1px solid rgba(255, 255, 255, 0.4);
                          border-radius: 4px;
                          font-size: 10px;
                          color: #333;
                          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                          transition: all 0.3s ease;
                        ">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Rating Range Filter -->
                <div>
                  <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">
                    📊 Rating Range
                  </label>
                  <select id="cf-rating-filter" style="
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    font-size: 12px;
                    color: #333;
                    box-shadow: 
                      0 2px 8px rgba(102, 126, 234, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    transition: all 0.3s ease;
                  ">
                    <option value="all">All Ratings</option>
                    <option value="newbie">Newbie (0-1199)</option>
                    <option value="pupil">Pupil (1200-1399)</option>
                    <option value="specialist">Specialist (1400-1599)</option>
                    <option value="expert">Expert (1600-1899)</option>
                    <option value="cm">Candidate Master (1900-2099)</option>
                    <option value="master">Master (2100-2299)</option>
                    <option value="igm">International Grandmaster (2400+)</option>
                  </select>
                </div>
                
                <!-- Show/Hide Options -->
                <div>
                  <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">
                    👁️ Display Options
                  </label>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <label style="
                      display: flex; 
                      align-items: center; 
                      gap: 6px; 
                      font-size: 12px;
                      padding: 6px 10px;
                      background: rgba(255, 255, 255, 0.1);
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      border: 1px solid rgba(255, 255, 255, 0.3);
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    ">
                      <input type="checkbox" id="cf-show-points" checked style="
                        margin: 0;
                        accent-color: #667eea;
                      ">
                      Points
                    </label>
                    <label style="
                      display: flex; 
                      align-items: center; 
                      gap: 6px; 
                      font-size: 12px;
                      padding: 6px 10px;
                      background: rgba(255, 255, 255, 0.1);
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      border: 1px solid rgba(255, 255, 255, 0.3);
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    ">
                      <input type="checkbox" id="cf-show-grid" checked style="
                        margin: 0;
                        accent-color: #667eea;
                      ">
                      Grid
                    </label>
                  </div>
                </div>
                
                <!-- Apply Filters Button -->
                <div>
                  <button id="cf-apply-filters" style="
                    width: 100%;
                    padding: 10px 12px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: 
                      0 4px 12px rgba(102, 126, 234, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    transition: all 0.3s ease;
                  ">Apply Filters</button>
                </div>
              </div>
            </div>
            
            <div id="cf-comparison-plot" style="
              width: 100%;
              height: 350px;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(30px);
              -webkit-backdrop-filter: blur(30px);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 12px;
              box-shadow: 
                0 4px 16px rgba(102, 126, 234, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
              margin-bottom: 16px;
              flex-shrink: 0;
            "></div>
            
            <div style="
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              margin-bottom: 16px;
              justify-content: center;
              flex-shrink: 0;
            ">
              ${accountData.map((account, index) => `
                <div class="cf-legend-item" data-account="${account.handle}" style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  background: rgba(248, 249, 250, 0.1);
                  backdrop-filter: blur(20px);
                  -webkit-backdrop-filter: blur(20px);
                  padding: 8px 12px;
                  border-radius: 20px;
                  border: 2px solid ${colors[index % colors.length]};
                  box-shadow: 
                    0 2px 8px rgba(102, 126, 234, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                  cursor: pointer;
                  transition: all 0.3s ease;
                  opacity: 1;
                ">
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: ${colors[index % colors.length]};
                    border-radius: 50%;
                  "></div>
                  <span style="font-weight: 600; color: #333;">${account.handle}</span>
                  <span style="color: #666; font-size: 12px;">
                    (${account.contests.length} contests)
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', graphHTML);
    
    // Store original data for filtering
    this.originalAccountData = accountData;
    this.originalSeries = series;
    this.currentFilters = {
      timeRange: 'all',
      ratingRange: 'all',
      showPoints: true,
      showGrid: true,
      hiddenAccounts: new Set(),
      customDateFrom: null,
      customDateTo: null
    };
    
    // Add filter event listeners
    this.setupFilterListeners();
    
    // Initial render
    this.renderFilteredGraph();
  }

  /**
   * Setup event listeners for filters
   */
  setupFilterListeners() {
    const applyBtn = document.getElementById('cf-apply-filters');
    const resetBtn = document.getElementById('cf-reset-filters');
    const timeFilter = document.getElementById('cf-time-filter');
    const ratingFilter = document.getElementById('cf-rating-filter');
    const showPoints = document.getElementById('cf-show-points');
    const showGrid = document.getElementById('cf-show-grid');
    const customDateRange = document.getElementById('cf-custom-date-range');
    const dateFrom = document.getElementById('cf-date-from');
    const dateTo = document.getElementById('cf-date-to');
    
    // Handle time filter change to show/hide custom date inputs
    if (timeFilter) {
      timeFilter.addEventListener('change', () => {
        if (timeFilter.value === 'custom') {
          customDateRange.style.display = 'block';
          // Set default dates if empty
          if (!dateFrom.value || !dateTo.value) {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            
            dateFrom.value = oneYearAgo.toISOString().split('T')[0];
            dateTo.value = now.toISOString().split('T')[0];
          }
        } else {
          customDateRange.style.display = 'none';
        }
      });
    }
    
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.updateFilters();
        this.renderFilteredGraph();
      });
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
        this.renderFilteredGraph();
      });
    }
    
    // Add click listeners to legend items for show/hide
    document.querySelectorAll('.cf-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const account = item.dataset.account;
        if (this.currentFilters.hiddenAccounts.has(account)) {
          this.currentFilters.hiddenAccounts.delete(account);
          item.style.opacity = '1';
        } else {
          this.currentFilters.hiddenAccounts.add(account);
          item.style.opacity = '0.3';
        }
        this.renderFilteredGraph();
      });
      
      item.addEventListener('mouseenter', () => {
        if (!this.currentFilters.hiddenAccounts.has(item.dataset.account)) {
          item.style.transform = 'scale(1.05)';
        }
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.transform = 'scale(1)';
      });
    });
  }

  /**
   * Update filters from UI
   */
  updateFilters() {
    const timeFilter = document.getElementById('cf-time-filter');
    const ratingFilter = document.getElementById('cf-rating-filter');
    const showPoints = document.getElementById('cf-show-points');
    const showGrid = document.getElementById('cf-show-grid');
    const dateFrom = document.getElementById('cf-date-from');
    const dateTo = document.getElementById('cf-date-to');
    
    if (timeFilter) this.currentFilters.timeRange = timeFilter.value;
    if (ratingFilter) this.currentFilters.ratingRange = ratingFilter.value;
    if (showPoints) this.currentFilters.showPoints = showPoints.checked;
    if (showGrid) this.currentFilters.showGrid = showGrid.checked;
    
    // Handle custom date range
    if (timeFilter && timeFilter.value === 'custom') {
      if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
        this.currentFilters.customDateFrom = new Date(dateFrom.value).getTime();
        this.currentFilters.customDateTo = new Date(dateTo.value).getTime() + (24 * 60 * 60 * 1000 - 1); // End of day
      } else {
        // If custom is selected but dates are empty, fall back to "all"
        this.currentFilters.timeRange = 'all';
        if (timeFilter) timeFilter.value = 'all';
      }
    } else {
      // Clear custom date range if not using custom
      this.currentFilters.customDateFrom = null;
      this.currentFilters.customDateTo = null;
    }
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    this.currentFilters = {
      timeRange: 'all',
      ratingRange: 'all',
      showPoints: true,
      showGrid: true,
      hiddenAccounts: new Set(),
      customDateFrom: null,
      customDateTo: null
    };
    
    // Update UI
    const timeFilter = document.getElementById('cf-time-filter');
    const ratingFilter = document.getElementById('cf-rating-filter');
    const showPoints = document.getElementById('cf-show-points');
    const showGrid = document.getElementById('cf-show-grid');
    const customDateRange = document.getElementById('cf-custom-date-range');
    const dateFrom = document.getElementById('cf-date-from');
    const dateTo = document.getElementById('cf-date-to');
    
    if (timeFilter) timeFilter.value = 'all';
    if (ratingFilter) ratingFilter.value = 'all';
    if (showPoints) showPoints.checked = true;
    if (showGrid) showGrid.checked = true;
    
    // Hide custom date range and clear values
    if (customDateRange) customDateRange.style.display = 'none';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    // Reset legend items
    document.querySelectorAll('.cf-legend-item').forEach(item => {
      item.style.opacity = '1';
    });
  }

  /**
   * Apply filters to data and render
   */
  renderFilteredGraph() {
    // Filter data based on current filters
    const filteredData = this.applyFiltersToData(this.originalAccountData, this.originalSeries);
    
    setTimeout(() => {
      try {
        // Strategy 1: Try to use existing Flot library
        if (typeof window.$ !== 'undefined' && window.$.plot) {
          console.log('[CF Enhancer] Using jQuery Flot for filtered graph rendering');
          window.$('#cf-comparison-plot').plot(filteredData.series, {
            xaxis: {
              mode: 'time',
              timeformat: '%Y-%m-%d'
            },
            yaxis: {
              min: 0
            },
            grid: {
              hoverable: true,
              clickable: true,
              borderWidth: 1,
              borderColor: '#e1e5e9',
              show: this.currentFilters.showGrid
            },
            legend: {
              show: false // We have our custom legend
            },
            points: {
              show: this.currentFilters.showPoints
            }
          });
        } else {
          // Strategy 2: Use our custom Canvas-based graph renderer
          console.log('[CF Enhancer] Using custom Canvas renderer for filtered graph');
          this.renderCustomGraph(filteredData.accountData, filteredData.series);
        }
      } catch (error) {
        console.error('[CF Enhancer] Error creating filtered plot with Flot, falling back to custom renderer:', error);
        this.renderCustomGraph(filteredData.accountData, filteredData.series);
      }
    }, 100);
  }

  /**
   * Apply current filters to the data
   * @param {Array} accountData - Original account data
   * @param {Array} series - Original series data
   * @returns {Object} Filtered data
   */
  applyFiltersToData(accountData, series) {
    const now = Date.now();
    let timeFilterMs = 0;
    let customTimeRange = false;
    
    // Calculate time filter
    switch (this.currentFilters.timeRange) {
      case '1y': timeFilterMs = now - (365 * 24 * 60 * 60 * 1000); break;
      case '2y': timeFilterMs = now - (2 * 365 * 24 * 60 * 60 * 1000); break;
      case '3y': timeFilterMs = now - (3 * 365 * 24 * 60 * 60 * 1000); break;
      case 'custom': 
        customTimeRange = true;
        timeFilterMs = this.currentFilters.customDateFrom || 0;
        break;
      default: timeFilterMs = 0; break;
    }
    
    // Calculate rating filter range
    let minRating = 0, maxRating = Infinity;
    switch (this.currentFilters.ratingRange) {
      case 'newbie': minRating = 0; maxRating = 1199; break;
      case 'pupil': minRating = 1200; maxRating = 1399; break;
      case 'specialist': minRating = 1400; maxRating = 1599; break;
      case 'expert': minRating = 1600; maxRating = 1899; break;
      case 'cm': minRating = 1900; maxRating = 2099; break;
      case 'master': minRating = 2100; maxRating = 2299; break;
      case 'igm': minRating = 2400; maxRating = Infinity; break;
      default: minRating = 0; maxRating = Infinity; break;
    }
    
    // Filter series data
    const filteredSeries = series
      .filter(serie => !this.currentFilters.hiddenAccounts.has(serie.label))
      .map(serie => ({
        ...serie,
        data: serie.data.filter(point => {
          const time = point[0];
          const rating = point[1];
          
          // Time filtering logic
          let timeOk = false;
          if (customTimeRange) {
            // Custom date range: check if time is between customDateFrom and customDateTo
            const fromTime = this.currentFilters.customDateFrom || 0;
            const toTime = this.currentFilters.customDateTo || now;
            timeOk = time >= fromTime && time <= toTime;
          } else {
            // Standard time ranges: check if time is after the calculated threshold
            timeOk = timeFilterMs === 0 || time >= timeFilterMs;
          }
          
          const ratingOk = rating >= minRating && rating <= maxRating;
          
          return timeOk && ratingOk;
        })
      }))
      .filter(serie => serie.data.length > 0); // Remove series with no data after filtering
    
    // Filter account data to match
    const filteredAccountData = accountData.filter(account => 
      !this.currentFilters.hiddenAccounts.has(account.handle) &&
      filteredSeries.some(serie => serie.label === account.handle)
    );
    
    return {
      accountData: filteredAccountData,
      series: filteredSeries
    };
  }

  /**
   * Render custom graph using HTML5 Canvas
   * @param {Array} accountData - Array of account data objects
   * @param {Array} series - Graph series data
   */
  renderCustomGraph(accountData, series) {
    const plotDiv = document.getElementById('cf-comparison-plot');
    if (!plotDiv) return;
    
    // Create canvas element
    plotDiv.innerHTML = `
      <canvas id="cf-custom-canvas" style="
        width: 100%;
        height: 100%;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 
          0 8px 32px rgba(31, 38, 135, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      "></canvas>
    `;
    
    const canvas = document.getElementById('cf-custom-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = plotDiv.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 40, bottom: 60, left: 80 };
    
    // Clear canvas and create ultra-transparent glass background
    ctx.clearRect(0, 0, width, height);
    
    // Create extremely subtle background with maximum transparency
    const primaryGradient = ctx.createLinearGradient(0, 0, width, height);
    primaryGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    primaryGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    primaryGradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
    
    // Apply minimal background
    ctx.fillStyle = primaryGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate data ranges
    let minTime = Infinity, maxTime = -Infinity;
    let minRating = Infinity, maxRating = -Infinity;
    
    series.forEach(serie => {
      serie.data.forEach(point => {
        minTime = Math.min(minTime, point[0]);
        maxTime = Math.max(maxTime, point[0]);
        minRating = Math.min(minRating, point[1]);
        maxRating = Math.max(maxRating, point[1]);
      });
    });
    
    // Add some padding to rating range
    const ratingRange = maxRating - minRating;
    minRating = Math.max(0, minRating - ratingRange * 0.1);
    maxRating = maxRating + ratingRange * 0.1;
    
    // Helper functions
    const timeToX = (time) => padding.left + ((time - minTime) / (maxTime - minTime)) * (width - padding.left - padding.right);
    const ratingToY = (rating) => height - padding.bottom - ((rating - minRating) / (maxRating - minRating)) * (height - padding.top - padding.bottom);
    
    // Calculate step values for grid and labels
    const timeStep = (maxTime - minTime) / 6;
    const ratingStep = (maxRating - minRating) / 5;
    
    // Draw grid (if enabled) with minimal transparency
    if (!this.currentFilters || this.currentFilters.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([1, 3]);
      
      // Vertical grid lines (time)
      for (let i = 0; i <= 6; i++) {
        const time = minTime + i * timeStep;
        const x = timeToX(time);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
      }
      
      // Horizontal grid lines (rating)
      for (let i = 0; i <= 5; i++) {
        const rating = minRating + i * ratingStep;
        const y = ratingToY(rating);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      
      ctx.setLineDash([]); // Reset line dash
    }
    
    // Draw axes with better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow
    
    // Draw series with enhanced glass effects
    series.forEach((serie, index) => {
      if (serie.data.length === 0) return;
      
      // Create gradient for line with transparency
      const lineGradient = ctx.createLinearGradient(0, 0, width, height);
      const baseColor = serie.color;
      const rgb = this.hexToRgb(baseColor);
      lineGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
      lineGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
      ctx.shadowBlur = 3;
      
      // Draw line
      ctx.beginPath();
      serie.data.forEach((point, i) => {
        const x = timeToX(point[0]);
        const y = ratingToY(point[1]);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
      
      // Draw points (if enabled) with glass effect
      if (!this.currentFilters || this.currentFilters.showPoints) {
        serie.data.forEach(point => {
          const x = timeToX(point[0]);
          const y = ratingToY(point[1]);
          
          // Outer glow
          ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
          ctx.shadowBlur = 6;
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Inner highlight for glass effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(x - 1, y - 1, 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Core point
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
    
    // Draw labels with high contrast for visibility
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Time labels (X-axis) - with strong contrast
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 6; i++) {
      const time = minTime + i * timeStep;
      const x = timeToX(time);
      const date = new Date(time);
      const label = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      
      // Draw strong background for readability
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x - textWidth/2 - 6, height - padding.bottom + 8, textWidth + 12, 20);
      
      // Add border for definition
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - textWidth/2 - 6, height - padding.bottom + 8, textWidth + 12, 20);
      
      // Draw text with high contrast
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.fillText(label, x, height - padding.bottom + 15);
      ctx.shadowBlur = 0;
    }
    
    // Rating labels (Y-axis) - with strong contrast
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const rating = minRating + i * ratingStep;
      const y = ratingToY(rating);
      const label = Math.round(rating).toString();
      
      // Draw strong background for readability
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(padding.left - textWidth - 18, y - 10, textWidth + 14, 20);
      
      // Add border for definition
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(padding.left - textWidth - 18, y - 10, textWidth + 14, 20);
      
      // Draw text with high contrast
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.fillText(label, padding.left - 8, y);
      ctx.shadowBlur = 0;
    }
    
    // Add axis titles with high contrast
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Y-axis title (Rating) with strong background
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Strong background for Y-axis title
    const yTitleWidth = ctx.measureText('Rating').width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-yTitleWidth/2 - 8, -12, yTitleWidth + 16, 24);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-yTitleWidth/2 - 8, -12, yTitleWidth + 16, 24);
    
    // Title text with strong contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.fillText('Rating', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
    
    // X-axis title (Time) with strong background
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Strong background for X-axis title
    const xTitleWidth = ctx.measureText('Time').width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width/2 - xTitleWidth/2 - 8, height - 25, xTitleWidth + 16, 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(width/2 - xTitleWidth/2 - 8, height - 25, xTitleWidth + 16, 20);
    
    // Title text with strong contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.fillText('Time', width / 2, height - 8);
    ctx.shadowBlur = 0;
    
    // Add hover functionality
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Find closest data point
      let closestDistance = Infinity;
      let closestPoint = null;
      let closestSerie = null;
      
      series.forEach(serie => {
        serie.data.forEach(point => {
          const x = timeToX(point[0]);
          const y = ratingToY(point[1]);
          const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
          
          if (distance < closestDistance && distance < 20) {
            closestDistance = distance;
            closestPoint = point;
            closestSerie = serie;
          }
        });
      });
      
      // Update cursor and tooltip
      if (closestPoint && closestSerie) {
        canvas.style.cursor = 'pointer';
        canvas.title = `${closestSerie.label}: ${closestPoint[1]} rating on ${new Date(closestPoint[0]).toLocaleDateString()}`;
      } else {
        canvas.style.cursor = 'default';
        canvas.title = '';
      }
    });
    
    console.log('[CF Enhancer] Custom graph rendered successfully');
  }

  /**
   * Convert hex color to RGB values
   * @param {string} hex - Hex color string
   * @returns {Object} RGB values
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 102, g: 126, b: 234 }; // fallback color
  }

  /**
   * Show data in table format as fallback
   * @param {Array} accountData - Array of account data objects
   */
  showDataTable(accountData) {
    const plotDiv = document.getElementById('cf-comparison-plot');
    if (!plotDiv) return;
    
    plotDiv.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h3 style="color: #333; margin-bottom: 20px;">📊 Rating Summary</h3>
        <div style="overflow-x: auto;">
          <table style="
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          ">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e1e5e9;">Handle</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e1e5e9;">Contests</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e1e5e9;">Current Rating</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e1e5e9;">Max Rating</th>
              </tr>
            </thead>
            <tbody>
              ${accountData.map(account => {
                const currentRating = account.contests.length > 0 ? 
                  account.contests[account.contests.length - 1].newRating : 'N/A';
                const maxRating = account.contests.length > 0 ? 
                  Math.max(...account.contests.map(c => c.newRating)) : 'N/A';
                
                return `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f3f4; font-weight: 600;">
                      ${account.handle}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f3f4; text-align: center;">
                      ${account.contests.length}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f3f4; text-align: center;">
                      ${currentRating}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f3f4; text-align: center;">
                      ${maxRating}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p style="color: #888; font-size: 14px; margin-top: 16px;">
          📈 Graph visualization requires jQuery Flot library
        </p>
      </div>
    `;
  }

  /**
   * Show success message
   * @param {string} message - Success message HTML
   */
  showSuccessMessage(message) {
    this.showTemporaryMessage(message, '#28a745');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    this.showTemporaryMessage(message, '#dc3545');
  }

  /**
   * Show temporary message
   * @param {string} message - Message content
   * @param {string} color - Border color
   */
  showTemporaryMessage(message, color) {
    this.removeModernDialog();
    
    const messageHTML = `
      <div id="cf-enhancer-message" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 32px;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-left: 5px solid ${color};
        max-width: 500px;
        animation: slideIn 0.3s ease-out;
      ">
        ${message}
        <button onclick="document.getElementById('cf-enhancer-message').remove()" style="
          margin-top: 20px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: ${color};
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: block;
          margin-left: auto;
          margin-right: auto;
        ">OK</button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', messageHTML);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      const msg = document.getElementById('cf-enhancer-message');
      if (msg) msg.remove();
    }, 8000);
  }

  /**
   * Remove any existing dialogs
   */
  removeModernDialog() {
    const elements = [
      'cf-enhancer-overlay',
      'cf-enhancer-message',
      'cf-enhancer-loading',
      'cf-enhancer-graph-overlay'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });
  }

  /**
   * Check if the page contains graph script data
   * @returns {boolean} True if graph data script is found
   */
  hasGraphScript() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.textContent && 
          script.textContent.includes('data.push') && 
          script.textContent.includes('placeholder')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if current page should have a rating graph
   * @returns {boolean} True if page should have a graph
   */
  shouldHaveGraph() {
    const url = window.location.href;
    
    // Check if we're on a profile page
    if (!url.includes('/profile/')) return false;
    
    // Check for graph type parameter or default profile view
    const urlParams = new URLSearchParams(window.location.search);
    const graphType = urlParams.get('graphType');
    
    // Check for both possible placeholder element IDs
    const hasPlaceholder = document.getElementById('placeholder') !== null;
    const hasUsersRatingGraphPlaceholder = document.getElementById('usersRatingGraphPlaceholder') !== null;
    const hasAnyPlaceholder = hasPlaceholder || hasUsersRatingGraphPlaceholder;
    
    // Default profile view or specific graph types should have graphs
    const shouldHaveByUrl = !graphType || graphType === 'all' || graphType === 'rating';
    
    // Additional check: Look for "no rating graph" messages
    const noRatingMessage = document.querySelector('.caption, .text, p, div');
    let hasNoRatingText = false;
    if (noRatingMessage) {
      const pageText = document.body.textContent || '';
      hasNoRatingText = pageText.includes('no contests') || 
                       pageText.includes('No contests') || 
                       pageText.includes('no rating') ||
                       pageText.includes('No rating');
    }
    
    console.log('[CF Enhancer] Graph detection:', {
      url: url,
      graphType: graphType,
      hasPlaceholder: hasPlaceholder,
      hasUsersRatingGraphPlaceholder: hasUsersRatingGraphPlaceholder,
      hasAnyPlaceholder: hasAnyPlaceholder,
      shouldHaveByUrl: shouldHaveByUrl,
      hasNoRatingText: hasNoRatingText,
      readyState: document.readyState,
      pageContentLength: document.body.textContent?.length || 0
    });
    
    // If we detect "no contests" text, don't try to enhance
    if (hasNoRatingText) {
      console.log('[CF Enhancer] Detected user has no rating data, skipping graph enhancement');
      return false;
    }
    
    // If we should have a graph by URL but placeholder doesn't exist yet, 
    // we should still initialize and wait for it (unless we detected no rating text)
    return shouldHaveByUrl;
  }

}

// Initialize when script loads - be more specific about profile pages with graphs
if (window.location.href.includes('/profile/') && 
    (window.location.href.includes('graphType=') || !window.location.search)) {
  
  console.log('[CF Enhancer] MultiGraph: Detected profile page, setting up initialization...');
  
  // Multiple initialization strategies for maximum compatibility
  
  // Strategy 1: Immediate initialization if DOM is ready
  if (document.readyState === 'complete') {
    console.log('[CF Enhancer] Document complete, initializing immediately');
    new MultiGraphFeature();
  } 
  // Strategy 2: Wait for DOM content to load
  else if (document.readyState === 'loading') {
    console.log('[CF Enhancer] Document loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[CF Enhancer] DOMContentLoaded fired, initializing');
      new MultiGraphFeature();
    });
  } 
  // Strategy 3: Interactive state - wait a bit more
  else {
    console.log('[CF Enhancer] Document interactive, initializing with delay');
    setTimeout(() => {
      new MultiGraphFeature();
    }, 500);
  }
  
  // Strategy 4: Backup initialization after full page load
  window.addEventListener('load', () => {
    console.log('[CF Enhancer] Window load event fired, backup initialization');
    // Only initialize if we haven't already
    if (!window.cfEnhancerMultiGraph) {
      new MultiGraphFeature();
    }
  });
}
