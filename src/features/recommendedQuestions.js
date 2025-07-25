/**
 * Recommended Questions Feature
 * @author JehadurRE
 * 
 * Shows recommended problems based on user rating and solve history
 */

class RecommendedQuestionsFeature {
  constructor() {
    console.log('[CF Enhancer] RecommendedQuestionsFeature constructor called');
    
    this.isInitialized = false;
    this.userRating = null;
    this.userHandle = null;
    this.apiBaseUrl = 'https://codeforces.com/api/';
    this.cachedProblems = null; // Cache for problems to avoid repeated API calls
    this.lastRecommendations = []; // Store last recommendations to avoid duplicates
    this.init();
  }

  async init() {
    console.log('[CF Enhancer] RecommendedQuestions init() called');
    
    try {
      // Check if CFEnhancerStorage is available
      if (typeof CFEnhancerStorage !== 'undefined') {
        const options = await CFEnhancerStorage.getOptions(['recommendedQuestions'], true);
        console.log('[CF Enhancer] Retrieved recommended questions options:', options);
        
        if (options.recommendedQuestions) {
          await this.setupRecommendedQuestions();
          this.isInitialized = true;
        }
      } else {
        console.warn('[CF Enhancer] CFEnhancerStorage not available for recommended questions');
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing RecommendedQuestions:', error);
    }
  }

  /**
   * Setup recommended questions functionality
   */
  async setupRecommendedQuestions() {
    console.log('[CF Enhancer] Setting up recommended questions');
    
    // Wait for document ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.executeRecommendations();
      });
    } else {
      this.executeRecommendations();
    }
  }

  /**
   * Execute recommendations logic
   */
  async executeRecommendations() {
    try {
      // Get user information
      await this.getUserInfo();
      
      if (this.userHandle) {
        // Add recommendations panel
        await this.addRecommendationsPanel();
        
        // Load and display recommendations
        await this.loadRecommendations();
      } else {
        console.log('[CF Enhancer] User not logged in, skipping recommendations');
      }
    } catch (error) {
      console.error('[CF Enhancer] Error in executeRecommendations:', error);
    }
  }

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get user information from the page
   */
  async getUserInfo() {
    // Try to get user handle from the page
    const userLinks = document.querySelectorAll('a[href*="/profile/"]');
    for (const link of userLinks) {
      const href = link.getAttribute('href');
      const match = href.match(/\/profile\/([^\/]+)/);
      if (match) {
        this.userHandle = match[1];
        break;
      }
    }
    
    // Alternative: check for user info in header
    if (!this.userHandle) {
      const headerUser = document.querySelector('.lang-chooser a[href*="/profile/"]');
      if (headerUser) {
        const href = headerUser.getAttribute('href');
        const match = href.match(/\/profile\/([^\/]+)/);
        if (match) {
          this.userHandle = match[1];
        }
      }
    }
    
    console.log('[CF Enhancer] User handle:', this.userHandle);
    
    if (this.userHandle) {
      try {
        // Get user rating from API
        const response = await this.fetchWithTimeout(`${this.apiBaseUrl}user.info?handles=${this.userHandle}`);
        const data = await response.json();
        
        if (data.status === 'OK' && data.result.length > 0) {
          this.userRating = data.result[0].rating || 1200; // Default to 1200 if no rating
          console.log('[CF Enhancer] User rating:', this.userRating);
        }
      } catch (error) {
        console.error('[CF Enhancer] Error fetching user info:', error);
        this.userRating = 1200; // Default rating
      }
    }
  }

  /**
   * Check if dark mode is enabled
   */
  async isDarkModeEnabled() {
    try {
      // Check if dark mode CSS is present
      const darkModeStyle = document.getElementById('cf-enhancer-dark-mode');
      if (darkModeStyle) {
        console.log('[CF Enhancer] Dark mode detected via CSS element');
        return true;
      }
      
      // Check storage directly
      if (typeof CFEnhancerStorage !== 'undefined') {
        const options = await CFEnhancerStorage.getOptions(['darkMode'], false);
        console.log('[CF Enhancer] Dark mode from storage:', options.darkMode);
        return options.darkMode === true;
      }
      
      // Fallback checks
      const bodyHasDarkMode = document.body.classList.contains('cf-dark-mode');
      const htmlHasDarkMode = document.documentElement.classList.contains('cf-dark-mode');
      const localStorageDarkMode = localStorage.getItem('cf-dark-mode') === 'true';
      const bodyHasDarkClass = document.body.classList.contains('dark-mode');
      const htmlHasDarkClass = document.documentElement.classList.contains('dark-mode');
      
      const isDark = bodyHasDarkMode || htmlHasDarkMode || localStorageDarkMode || 
                     bodyHasDarkClass || htmlHasDarkClass;
      
      console.log('[CF Enhancer] Dark mode fallback check:', {
        darkModeStyle: !!darkModeStyle,
        bodyHasDarkMode,
        htmlHasDarkMode,
        localStorageDarkMode,
        bodyHasDarkClass,
        htmlHasDarkClass,
        isDark
      });
      
      return isDark;
    } catch (error) {
      console.error('[CF Enhancer] Error checking dark mode:', error);
      return false;
    }
  }

  /**
   * Get theme-aware colors
   */
  async getThemeColors() {
    const isDark = await this.isDarkModeEnabled();
    return {
      background: isDark ? '#2d2d2d' : '#f8f8f8',
      border: isDark ? '#555' : '#ddd',
      text: isDark ? '#e0e0e0' : '#333',
      cardBackground: isDark ? '#3d3d3d' : '#fff',
      cardBorder: isDark ? '#555' : '#eee',
      mutedText: isDark ? '#aaa' : '#666',
      lightText: isDark ? '#888' : '#888'
    };
  }

  /**
   * Add recommendations panel to the page
   */
  async addRecommendationsPanel() {
    // Check if panel already exists
    if (document.getElementById('cf-recommendations-panel')) {
      return;
    }
    
    const colors = await this.getThemeColors();
    
    const panel = document.createElement('div');
    panel.id = 'cf-recommendations-panel';
    panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      z-index: 9999;
      font-size: 13px;
      overflow-y: auto;
      transition: all 0.3s ease;
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: ${colors.text}; font-size: 14px;">📚 Recommended Problems</h3>
        <button id="cf-recommendations-close" style="background: none; border: none; font-size: 16px; cursor: pointer; color: ${colors.mutedText};">×</button>
      </div>
      <div id="cf-recommendations-content">
        <div style="text-align: center; padding: 20px; color: ${colors.mutedText};">
          <div style="margin-bottom: 10px;">
            <div style="border: 2px solid ${colors.border}; border-top: 2px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
          Loading recommendations...
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: ${colors.lightText}; text-align: center;">
        Based on your rating: ${this.userRating || 'Unknown'}
      </div>
    `;
    
    // Add close functionality
    panel.querySelector('#cf-recommendations-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
    
    // Add minimize/maximize functionality
    let isMinimized = false;
    panel.addEventListener('dblclick', () => {
      const content = panel.querySelector('#cf-recommendations-content');
      if (isMinimized) {
        content.style.display = 'block';
        panel.style.height = 'auto';
        isMinimized = false;
      } else {
        content.style.display = 'none';
        panel.style.height = '40px';
        isMinimized = true;
      }
    });
    
    document.body.appendChild(panel);
    console.log('[CF Enhancer] Recommendations panel added');
    
    // Listen for dark mode changes
    this.setupDarkModeListener();
  }

  /**
   * Setup listener for dark mode changes
   */
  setupDarkModeListener() {
    console.log('[CF Enhancer] Setting up dark mode listeners');
    
    // Listen for class changes on body and documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          console.log('[CF Enhancer] Class mutation detected, updating theme');
          setTimeout(() => this.updatePanelTheme(), 100);
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'cf-dark-mode') {
        console.log('[CF Enhancer] Storage change detected, updating theme');
        setTimeout(() => this.updatePanelTheme(), 100);
      }
    });
    
    // Listen for dark mode CSS changes (more reliable)
    const headObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          
          // Check for dark mode CSS being added or removed
          const darkModeStyleAdded = addedNodes.some(node => 
            node.id === 'cf-enhancer-dark-mode' || 
            (node.tagName === 'STYLE' && node.textContent && node.textContent.includes('cf-enhancer-dark-mode'))
          );
          
          const darkModeStyleRemoved = removedNodes.some(node => 
            node.id === 'cf-enhancer-dark-mode' || 
            (node.tagName === 'STYLE' && node.textContent && node.textContent.includes('cf-enhancer-dark-mode'))
          );
          
          if (darkModeStyleAdded || darkModeStyleRemoved) {
            console.log('[CF Enhancer] Dark mode CSS change detected, updating theme');
            setTimeout(() => this.updatePanelTheme(), 200);
          }
        }
      });
    });
    
    headObserver.observe(document.head, { childList: true, subtree: true });
    
    // Listen for dark mode toggle button clicks
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'cf-dark-mode-toggle') {
        console.log('[CF Enhancer] Dark mode toggle clicked, updating theme');
        setTimeout(() => this.updatePanelTheme(), 300);
      }
    });
    
    // Also check periodically for theme changes (fallback)
    setInterval(() => {
      this.updatePanelTheme();
    }, 3000);
    
    console.log('[CF Enhancer] Dark mode listeners setup complete');
  }

  /**
   * Update panel theme when dark mode changes
   */
  async updatePanelTheme() {
    const panel = document.getElementById('cf-recommendations-panel');
    if (!panel) return;
    
    const colors = await this.getThemeColors();
    const isDark = await this.isDarkModeEnabled();
    
    console.log('[CF Enhancer] Updating panel theme, isDark:', isDark, 'colors:', colors);
    
    // Update panel background and border with transition
    panel.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
    panel.style.backgroundColor = colors.background;
    panel.style.borderColor = colors.border;
    
    // Update header text color
    const header = panel.querySelector('h3');
    if (header) {
      header.style.transition = 'color 0.3s ease';
      header.style.color = colors.text;
    }
    
    // Update close button color
    const closeBtn = panel.querySelector('#cf-recommendations-close');
    if (closeBtn) {
      closeBtn.style.transition = 'color 0.3s ease';
      closeBtn.style.color = colors.mutedText;
    }
    
    // Update rating text color
    const ratingText = panel.querySelector('div:last-child');
    if (ratingText) {
      ratingText.style.transition = 'color 0.3s ease';
      ratingText.style.color = colors.lightText;
    }
    
    // Update content area background and text colors
    const contentDiv = document.getElementById('cf-recommendations-content');
    if (contentDiv) {
      // Update all card backgrounds
      const cards = contentDiv.querySelectorAll('div[style*="background"]');
      cards.forEach(card => {
        if (card.style.background.includes('#fff') || card.style.background.includes('#3d3d3d')) {
          card.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
          card.style.backgroundColor = colors.cardBackground;
          card.style.borderColor = colors.cardBorder;
        }
      });
      
      // If recommendations are loaded, refresh them with new colors
      if (this.lastRecommendations && this.lastRecommendations.length > 0) {
        console.log('[CF Enhancer] Refreshing recommendations display with new theme');
        await this.displayRecommendations(this.lastRecommendations, contentDiv);
      }
    }
  }

  /**
   * Load and display recommendations
   */
  async loadRecommendations() {
    const contentDiv = document.getElementById('cf-recommendations-content');
    if (!contentDiv) return;
    
    try {
      // Get user's solved problems
      const solvedProblems = await this.getUserSolvedProblems();
      
      // Calculate target rating range
      const targetRating = this.calculateTargetRating();
      
      // Get problems in target rating range
      const recommendations = await this.getRecommendedProblems(targetRating, solvedProblems);
      
      // Display recommendations
      await this.displayRecommendations(recommendations, contentDiv);
      
    } catch (error) {
      console.error('[CF Enhancer] Error loading recommendations:', error);
      const colors = await this.getThemeColors();
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #d32f2f;">
          <div style="margin-bottom: 10px;">❌</div>
          Error loading recommendations<br>
          <span style="font-size: 11px; color: ${colors.mutedText};">Check your internet connection</span>
          <div style="margin-top: 10px;">
            <button id="cf-retry-btn" 
                    style="background: #1976d2; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">
              🔄 Try Again
            </button>
          </div>
        </div>
      `;
      
      // Add event listener for retry button
      setTimeout(() => {
        const retryBtn = document.getElementById('cf-retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            console.log('[CF Enhancer] Retry button clicked');
            this.refreshRecommendations();
          });
        }
      }, 100);
    }
  }

  /**
   * Get user's solved problems
   */
  async getUserSolvedProblems() {
    if (!this.userHandle) return new Set();
    
    try {
      const response = await this.fetchWithTimeout(`${this.apiBaseUrl}user.status?handle=${this.userHandle}&from=1&count=1000`);
      const data = await response.json();
      
      const solvedProblems = new Set();
      
      if (data.status === 'OK') {
        data.result.forEach(submission => {
          if (submission.verdict === 'OK') {
            const problemId = `${submission.problem.contestId}${submission.problem.index}`;
            solvedProblems.add(problemId);
          }
        });
      }
      
      console.log('[CF Enhancer] Found', solvedProblems.size, 'solved problems');
      return solvedProblems;
    } catch (error) {
      console.error('[CF Enhancer] Error fetching solved problems:', error);
      return new Set();
    }
  }

  /**
   * Calculate target rating for recommendations
   */
  calculateTargetRating() {
    if (!this.userRating) return { min: 800, max: 1400 };
    
    // Recommend problems slightly above current rating
    const baseRating = this.userRating;
    const minRating = Math.max(800, baseRating - 200);
    const maxRating = baseRating + 300;
    
    return { min: minRating, max: maxRating };
  }

  /**
   * Get recommended problems from API
   */
  async getRecommendedProblems(targetRating, solvedProblems) {
    try {
      let problems, statistics;
      
      // Use cached data if available, otherwise fetch from API
      if (this.cachedProblems) {
        problems = this.cachedProblems.problems;
        statistics = this.cachedProblems.statistics;
      } else {
        const response = await this.fetchWithTimeout(`${this.apiBaseUrl}problemset.problems`);
        const data = await response.json();
        
        if (data.status !== 'OK') {
          throw new Error('API request failed');
        }
        
        problems = data.result.problems;
        statistics = data.result.problemStatistics;
        
        // Cache the data
        this.cachedProblems = { problems, statistics };
      }
      
      // Create a map of problem statistics
      const statsMap = new Map();
      statistics.forEach(stat => {
        const problemId = `${stat.contestId}${stat.index}`;
        statsMap.set(problemId, stat);
      });
      
      // Filter and score problems
      const candidates = problems
        .filter(problem => {
          const problemId = `${problem.contestId}${problem.index}`;
          const stats = statsMap.get(problemId);
          
          // Filter criteria
          return (
            problem.rating && 
            problem.rating >= targetRating.min && 
            problem.rating <= targetRating.max &&
            !solvedProblems.has(problemId) &&
            stats &&
            stats.solvedCount > 50 // Only popular problems
          );
        })
        .map(problem => {
          const problemId = `${problem.contestId}${problem.index}`;
          const stats = statsMap.get(problemId);
          
          // Calculate score based on various factors
          let score = 0;
          
          // Rating closeness to target
          const ratingDiff = Math.abs(problem.rating - (this.userRating + 100));
          score += Math.max(0, 100 - ratingDiff / 10);
          
          // Popularity (more solved = better)
          score += Math.min(50, Math.log(stats.solvedCount) * 10);
          
          // Problem type variety bonus
          if (problem.tags.includes('implementation')) score += 5;
          if (problem.tags.includes('math')) score += 5;
          if (problem.tags.includes('greedy')) score += 5;
          if (problem.tags.includes('dp')) score += 10;
          if (problem.tags.includes('graph')) score += 10;
          
          return {
            ...problem,
            stats,
            score
          };
        })
        .sort((a, b) => b.score - a.score);
      
      // Filter out recently shown problems to add variety
      const lastRecommendationIds = new Set(this.lastRecommendations.map(p => `${p.contestId}${p.index}`));
      const filteredCandidates = candidates.filter(problem => {
        const problemId = `${problem.contestId}${problem.index}`;
        return !lastRecommendationIds.has(problemId);
      });
      
      // If we filtered out too many, use all candidates
      const finalCandidates = filteredCandidates.length >= 10 ? filteredCandidates : candidates;
      
      // Shuffle the top recommendations to add variety
      const topCandidates = finalCandidates.slice(0, 30); // Get top 30
      this.shuffleArray(topCandidates);
      
      const selectedRecommendations = topCandidates.slice(0, 10); // Return top 10 after shuffle
      
      // Update last recommendations for next refresh
      this.lastRecommendations = selectedRecommendations;
      
      return selectedRecommendations;
    } catch (error) {
      console.error('[CF Enhancer] Error fetching problems:', error);
      return [];
    }
  }

  /**
   * Display recommendations in the panel
   */
  async displayRecommendations(recommendations, contentDiv) {
    const colors = await this.getThemeColors();
    
    if (recommendations.length === 0) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: ${colors.mutedText};">
          <div style="margin-bottom: 10px;">🤔</div>
          No recommendations found.<br>
          Try solving more problems!
        </div>
      `;
      return;
    }
    
    let html = '<div style="max-height: 300px; overflow-y: auto;">';
    
    recommendations.forEach((problem, index) => {
      const problemUrl = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
      const difficultyColor = this.getRatingColor(problem.rating);
      const linkColor = colors.background === '#2d2d2d' ? '#64b5f6' : '#0066cc';
      
      html += `
        <div style="margin-bottom: 8px; padding: 8px; background: ${colors.cardBackground}; border: 1px solid ${colors.cardBorder}; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <a href="${problemUrl}" target="_blank" style="color: ${linkColor}; text-decoration: none; font-weight: bold; font-size: 12px;">
                ${problem.contestId}${problem.index}. ${problem.name}
              </a>
              <div style="margin-top: 3px;">
                <span style="color: ${difficultyColor}; font-weight: bold; font-size: 11px;">
                  ★${problem.rating}
                </span>
                <span style="color: ${colors.lightText}; font-size: 11px; margin-left: 8px;">
                  ✓${problem.stats.solvedCount}
                </span>
              </div>
              <div style="margin-top: 3px; font-size: 10px;">
                ${problem.tags.slice(0, 3).map(tag => {
                  const tagBg = colors.background === '#2d2d2d' ? '#1e3a5f' : '#e8f4fd';
                  const tagColor = colors.background === '#2d2d2d' ? '#64b5f6' : '#1976d2';
                  return `<span style="background: ${tagBg}; color: ${tagColor}; padding: 1px 4px; border-radius: 2px; margin-right: 3px;">${tag}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    html += `
      <div style="margin-top: 10px; text-align: center;">
        <button id="cf-refresh-btn" 
                style="background: #1976d2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">
          🔄 Refresh
        </button>
      </div>
    `;
    
    contentDiv.innerHTML = html;
    
    // Add event listener for refresh button
    const refreshBtn = document.getElementById('cf-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('[CF Enhancer] Refresh button clicked');
        this.refreshRecommendations();
      });
    }
    
    // Store reference for refresh functionality
    window.cfRecommendations = this;
  }

  /**
   * Refresh recommendations
   */
  async refreshRecommendations() {
    const contentDiv = document.getElementById('cf-recommendations-content');
    if (!contentDiv) return;
    
    const colors = await this.getThemeColors();
    
    // Show loading state
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: ${colors.mutedText};">
        <div style="margin-bottom: 10px;">
          <div style="border: 2px solid ${colors.border}; border-top: 2px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        Loading new recommendations...
      </div>
    `;
    
    try {
      // Clear the last recommendations to force new ones
      this.lastRecommendations = [];
      
      // Load fresh recommendations
      await this.loadRecommendations();
    } catch (error) {
      console.error('[CF Enhancer] Error in refreshRecommendations:', error);
      const colors = await this.getThemeColors();
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #d32f2f;">
          <div style="margin-bottom: 10px;">❌</div>
          Error refreshing recommendations<br>
          <span style="font-size: 11px; color: ${colors.mutedText};">Check your internet connection</span>
          <div style="margin-top: 10px;">
            <button id="cf-retry-refresh-btn" 
                    style="background: #1976d2; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">
              🔄 Try Again
            </button>
          </div>
        </div>
      `;
      
      // Add event listener for retry button
      setTimeout(() => {
        const retryBtn = document.getElementById('cf-retry-refresh-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            console.log('[CF Enhancer] Retry refresh button clicked');
            this.refreshRecommendations();
          });
        }
      }, 100);
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get color for rating
   */
  getRatingColor(rating) {
    if (rating < 1200) return '#808080';
    if (rating < 1400) return '#008000';
    if (rating < 1600) return '#03a89e';
    if (rating < 1900) return '#0000ff';
    if (rating < 2100) return '#aa00aa';
    if (rating < 2400) return '#ff8c00';
    return '#ff0000';
  }
}

// Initialize recommended questions
console.log('[CF Enhancer] RecommendedQuestions script loaded');

// Initialize on any page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[CF Enhancer] DOM loaded, creating RecommendedQuestionsFeature');
    new RecommendedQuestionsFeature();
  });
} else {
  console.log('[CF Enhancer] DOM already loaded, creating RecommendedQuestionsFeature');
  new RecommendedQuestionsFeature();
}
