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
        this.addRecommendationsPanel();
        
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
        const response = await fetch(`${this.apiBaseUrl}user.info?handles=${this.userHandle}`);
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
   * Add recommendations panel to the page
   */
  addRecommendationsPanel() {
    // Check if panel already exists
    if (document.getElementById('cf-recommendations-panel')) {
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'cf-recommendations-panel';
    panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: #f8f8f8;
      border: 1px solid #ddd;
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
        <h3 style="margin: 0; color: #333; font-size: 14px;">📚 Recommended Problems</h3>
        <button id="cf-recommendations-close" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">×</button>
      </div>
      <div id="cf-recommendations-content">
        <div style="text-align: center; padding: 20px; color: #666;">
          <div style="margin-bottom: 10px;">⏳</div>
          Loading recommendations...
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: #888; text-align: center;">
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
      this.displayRecommendations(recommendations, contentDiv);
      
    } catch (error) {
      console.error('[CF Enhancer] Error loading recommendations:', error);
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #d32f2f;">
          <div style="margin-bottom: 10px;">❌</div>
          Error loading recommendations
        </div>
      `;
    }
  }

  /**
   * Get user's solved problems
   */
  async getUserSolvedProblems() {
    if (!this.userHandle) return new Set();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}user.status?handle=${this.userHandle}&from=1&count=1000`);
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
      const response = await fetch(`${this.apiBaseUrl}problemset.problems`);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error('API request failed');
      }
      
      const problems = data.result.problems;
      const statistics = data.result.problemStatistics;
      
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
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10 recommendations
      
      return candidates;
    } catch (error) {
      console.error('[CF Enhancer] Error fetching problems:', error);
      return [];
    }
  }

  /**
   * Display recommendations in the panel
   */
  displayRecommendations(recommendations, contentDiv) {
    if (recommendations.length === 0) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
          <div style="margin-bottom: 10px;">🤔</div>
          No recommendations found.<br>
          Try solving more problems!
        </div>
      `;
      return;
    }
    
    let html = '<div style="max-height: 300px; overflow-y: auto;">';
    
    recommendations.forEach((problem, index) => {
      const problemUrl = `https://codeforces.com/problem/${problem.contestId}/${problem.index}`;
      const difficultyColor = this.getRatingColor(problem.rating);
      
      html += `
        <div style="margin-bottom: 8px; padding: 8px; background: #fff; border: 1px solid #eee; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <a href="${problemUrl}" target="_blank" style="color: #0066cc; text-decoration: none; font-weight: bold; font-size: 12px;">
                ${problem.contestId}${problem.index}. ${problem.name}
              </a>
              <div style="margin-top: 3px;">
                <span style="color: ${difficultyColor}; font-weight: bold; font-size: 11px;">
                  ★${problem.rating}
                </span>
                <span style="color: #888; font-size: 11px; margin-left: 8px;">
                  ✓${problem.stats.solvedCount}
                </span>
              </div>
              <div style="margin-top: 3px; font-size: 10px;">
                ${problem.tags.slice(0, 3).map(tag => 
                  `<span style="background: #e8f4fd; color: #1976d2; padding: 1px 4px; border-radius: 2px; margin-right: 3px;">${tag}</span>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    html += `
      <div style="margin-top: 10px; text-align: center;">
        <button onclick="document.getElementById('cf-recommendations-panel').querySelector('#cf-recommendations-content').innerHTML = 'Loading...'; window.cfRecommendations.loadRecommendations();" 
                style="background: #1976d2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">
          🔄 Refresh
        </button>
      </div>
    `;
    
    contentDiv.innerHTML = html;
    
    // Store reference for refresh functionality
    window.cfRecommendations = this;
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
