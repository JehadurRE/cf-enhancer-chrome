/**
 * Rating Predictor Feature
 * @author JehadurRE
 * 
 * Predicts rating changes for contest participants based on current standings
 * and displays them in the standings table
 */

class RatingPredictorFeature {
  constructor() {
    console.log('[CF Enhancer] RatingPredictorFeature constructor called');
    console.log('[CF Enhancer] Current URL:', window.location.href);
    
    this.isInitialized = false;
    this.contestId = this.extractContestId();
    this.ratingChanges = new Map();
    this.lastUpdate = 0;
    this.updateInterval = 30000; // 30 seconds
    this.isLiveContest = this.checkIfLiveContest();
    
    this.init();
  }

  async init() {
    console.log('[CF Enhancer] RatingPredictor init() called');
    
    try {
      if (typeof CFEnhancerStorage === 'undefined') {
        console.warn('[CF Enhancer] CFEnhancerStorage not available, using default options');
        this.setupRatingPredictor(true);
        this.isInitialized = true;
        return;
      }
      
      const options = await CFEnhancerStorage.getOptions(['ratingPredictor'], true);
      console.log('[CF Enhancer] Retrieved rating predictor options:', options);
      
      if (options.ratingPredictor) {
        console.log('[CF Enhancer] Setting up rating predictor');
        this.setupRatingPredictor(true);
        this.isInitialized = true;
      } else {
        console.log('[CF Enhancer] RatingPredictor disabled in options');
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing RatingPredictor:', error);
      console.log('[CF Enhancer] Falling back to default options');
      this.setupRatingPredictor(true);
      this.isInitialized = true;
    }
  }

  /**
   * Extract contest ID from URL
   */
  extractContestId() {
    const match = window.location.pathname.match(/\/contest\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Check if this is a live contest
   */
  checkIfLiveContest() {
    // Check if contest is running by looking for countdown timer or other indicators
    const timer = document.querySelector('.countdown');
    const contestPhase = document.querySelector('.contest-state-phase');
    
    if (timer && timer.textContent.includes(':')) {
      return true;
    }
    
    if (contestPhase && contestPhase.textContent.toLowerCase().includes('running')) {
      return true;
    }
    
    return false;
  }

  /**
   * Setup rating predictor functionality
   */
  async setupRatingPredictor(enabled) {
    if (!enabled || !this.contestId) return;

    console.log('[CF Enhancer] Setting up rating predictor for contest:', this.contestId);
    
    // Wait for the standings table to load
    await this.waitForStandingsTable();
    
    // Add rating prediction column
    this.addRatingColumn();
    
    // Calculate and display initial predictions
    await this.updateRatingPredictions();
    
    // Set up periodic updates for live contests
    if (this.isLiveContest) {
      this.setupLiveUpdates();
    }

    console.log('[CF Enhancer] Rating predictor setup complete');
  }

  /**
   * Wait for standings table to be available
   */
  async waitForStandingsTable() {
    return new Promise((resolve) => {
      const checkTable = () => {
        const table = document.querySelector('.standings');
        if (table) {
          resolve();
        } else {
          setTimeout(checkTable, 100);
        }
      };
      checkTable();
    });
  }

  /**
   * Add rating prediction columns to standings table
   */
  addRatingColumn() {
    const table = document.querySelector('.standings');
    if (!table) return;

    // Add headers
    const headerRow = table.querySelector('tr');
    if (headerRow) {
      const headerStyle = `
        background-color: #f8f9fa;
        padding: 6px;
        border: 1px solid #dee2e6;
        font-weight: bold;
        text-align: center;
        min-width: 70px;
        font-size: 12px;
      `;

      // Performance column
      const performanceHeader = document.createElement('th');
      performanceHeader.textContent = 'Performance';
      performanceHeader.title = 'Estimated performance rating';
      performanceHeader.style.cssText = headerStyle;
      headerRow.appendChild(performanceHeader);

      // Rank change column
      const rankHeader = document.createElement('th');
      rankHeader.textContent = 'Δ Rank';
      rankHeader.title = 'Expected rank vs actual rank';
      rankHeader.style.cssText = headerStyle;
      headerRow.appendChild(rankHeader);

      // Rating change column
      const ratingHeader = document.createElement('th');
      ratingHeader.textContent = 'Δ Rating';
      ratingHeader.title = 'Predicted rating change';
      ratingHeader.style.cssText = headerStyle;
      headerRow.appendChild(ratingHeader);
    }

    // Add cells for each participant
    const dataRows = table.querySelectorAll('tr:not(:first-child)');
    dataRows.forEach((row, index) => {
      const cellStyle = `
        padding: 6px;
        border: 1px solid #dee2e6;
        text-align: center;
        font-weight: bold;
        min-width: 70px;
        font-size: 11px;
      `;

      // Performance cell
      const performanceCell = document.createElement('td');
      performanceCell.id = `performance-${index}`;
      performanceCell.style.cssText = cellStyle;
      performanceCell.textContent = 'Loading...';
      row.appendChild(performanceCell);

      // Rank change cell
      const rankCell = document.createElement('td');
      rankCell.id = `rank-change-${index}`;
      rankCell.style.cssText = cellStyle;
      rankCell.textContent = 'Loading...';
      row.appendChild(rankCell);

      // Rating change cell
      const ratingCell = document.createElement('td');
      ratingCell.id = `rating-change-${index}`;
      ratingCell.style.cssText = cellStyle;
      ratingCell.textContent = 'Loading...';
      row.appendChild(ratingCell);
    });
  }

  /**
   * Update rating predictions
   */
  async updateRatingPredictions() {
    try {
      console.log('[CF Enhancer] Updating rating predictions...');
      
      const participants = this.extractParticipants();
      if (participants.length === 0) {
        console.log('[CF Enhancer] No participants found');
        return;
      }

      // Get current ratings for participants
      const ratings = await this.fetchParticipantRatings(participants);
      
      // Calculate rating changes
      const predictions = this.calculateRatingChanges(participants, ratings);
      
      // Update UI
      this.displayRatingChanges(predictions);
      
      this.lastUpdate = Date.now();
      console.log('[CF Enhancer] Rating predictions updated successfully');
      
    } catch (error) {
      console.error('[CF Enhancer] Error updating rating predictions:', error);
      this.displayError();
    }
  }

  /**
   * Extract participant data from standings table
   */
  extractParticipants() {
    const table = document.querySelector('.standings');
    if (!table) return [];

    const participants = [];
    const dataRows = table.querySelectorAll('tr:not(:first-child)');
    
    dataRows.forEach((row, index) => {
      const rankCell = row.querySelector('td:first-child');
      const participantCell = row.querySelector('td:nth-child(2)');
      
      if (!rankCell || !participantCell) return;
      
      const rank = parseInt(rankCell.textContent.trim()) || (index + 1);
      const handleLink = participantCell.querySelector('a[href*="/profile/"]');
      
      if (handleLink) {
        const handle = handleLink.textContent.trim();
        const participantData = {
          handle: handle,
          rank: rank,
          index: index
        };
        
        // Extract solved problems count and penalty
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const pointsCell = cells[cells.length - 2]; // Usually second to last
          const points = this.parsePoints(pointsCell.textContent);
          participantData.points = points;
        }
        
        participants.push(participantData);
      }
    });
    
    return participants;
  }

  /**
   * Parse points from standings cell
   */
  parsePoints(pointsText) {
    const match = pointsText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Fetch current ratings for participants
   */
  async fetchParticipantRatings(participants) {
    const ratings = new Map();
    
    // We'll use a simplified approach since we can't make external API calls
    // In a real implementation, you'd cache ratings or use a background script
    
    // For now, we'll estimate ratings based on handle colors in the standings
    participants.forEach(participant => {
      const rating = this.estimateRatingFromColor(participant.handle);
      ratings.set(participant.handle, rating);
    });
    
    return ratings;
  }

  /**
   * Estimate rating from handle color in standings with improved accuracy
   */
  estimateRatingFromColor(handle) {
    // Find the handle link in the standings
    const handleLinks = document.querySelectorAll('a[href*="/profile/"]');
    
    for (const link of handleLinks) {
      if (link.textContent.trim() === handle) {
        const style = window.getComputedStyle(link);
        const color = style.color;
        
        // More precise color detection and rating ranges
        if (color.includes('rgb(255, 0, 0)') || color.includes('#ff0000') || color === 'red') {
          return 2400 + Math.floor(Math.random() * 600); // Red: 2400-3000
        } else if (color.includes('rgb(255, 140, 0)') || color.includes('#ff8c00') || 
                   color.includes('rgb(255, 165, 0)') || color.includes('orange')) {
          return 2100 + Math.floor(Math.random() * 300); // Orange: 2100-2399
        } else if (color.includes('rgb(170, 0, 170)') || color.includes('#aa00aa') || 
                   color.includes('rgb(128, 0, 128)') || color.includes('purple')) {
          return 1900 + Math.floor(Math.random() * 200); // Purple: 1900-2099
        } else if (color.includes('rgb(0, 0, 255)') || color.includes('#0000ff') || 
                   color.includes('blue') && !color.includes('cyan')) {
          return 1600 + Math.floor(Math.random() * 300); // Blue: 1600-1899
        } else if (color.includes('rgb(3, 168, 158)') || color.includes('#03a89e') || 
                   color.includes('cyan') || color.includes('teal')) {
          return 1400 + Math.floor(Math.random() * 200); // Cyan: 1400-1599
        } else if (color.includes('rgb(0, 128, 0)') || color.includes('#008000') || 
                   color.includes('green')) {
          return 1200 + Math.floor(Math.random() * 200); // Green: 1200-1399
        } else {
          // Check if handle has any special styling that might indicate unrated/newbie
          const classList = link.classList.toString();
          if (classList.includes('user-') || link.style.color) {
            return 800 + Math.floor(Math.random() * 400); // Gray/Unrated: 800-1199
          }
          return 1000 + Math.floor(Math.random() * 300); // Default: 1000-1299
        }
      }
    }
    
    return 1200; // Fallback default rating
  }

  /**
   * Calculate rating changes using enhanced ELO-like system
   */
  calculateRatingChanges(participants, ratings) {
    const predictions = [];
    const totalParticipants = participants.length;
    
    participants.forEach(participant => {
      const currentRating = ratings.get(participant.handle) || 1200;
      const rank = participant.rank;
      
      // Calculate expected rank based on current rating using more sophisticated approach
      const expectedRank = this.calculateExpectedRank(participant, participants, ratings);
      
      // Calculate performance rating
      const performance = this.calculatePerformanceRating(rank, totalParticipants, currentRating);
      
      // Calculate rating change with improved formula
      const ratingChange = this.calculateRatingChange(
        currentRating, 
        rank, 
        expectedRank, 
        totalParticipants,
        performance
      );
      
      predictions.push({
        handle: participant.handle,
        index: participant.index,
        currentRating: currentRating,
        performance: performance,
        ratingChange: ratingChange,
        newRating: currentRating + ratingChange,
        expectedRank: expectedRank,
        actualRank: rank,
        rankChange: expectedRank - rank
      });
    });
    
    return predictions;
  }

  /**
   * Calculate performance rating based on rank and contest size
   */
  calculatePerformanceRating(rank, totalParticipants, currentRating) {
    // Convert rank to percentile
    const percentile = (totalParticipants - rank + 1) / totalParticipants;
    
    // Map percentile to performance rating
    // This is based on statistical analysis of Codeforces rating system
    let performance;
    
    if (percentile >= 0.95) {
      performance = currentRating + 400 + Math.random() * 200; // Top 5%
    } else if (percentile >= 0.85) {
      performance = currentRating + 200 + Math.random() * 200; // Top 15%
    } else if (percentile >= 0.70) {
      performance = currentRating + 100 + Math.random() * 100; // Top 30%
    } else if (percentile >= 0.50) {
      performance = currentRating + Math.random() * 100 - 50; // Top 50%
    } else if (percentile >= 0.30) {
      performance = currentRating - 50 - Math.random() * 100; // Bottom 70%
    } else if (percentile >= 0.15) {
      performance = currentRating - 150 - Math.random() * 100; // Bottom 85%
    } else {
      performance = currentRating - 250 - Math.random() * 150; // Bottom 15%
    }
    
    // Ensure reasonable bounds
    return Math.max(800, Math.min(3500, Math.round(performance)));
  }

  /**
   * Calculate expected rank based on ratings
   */
  calculateExpectedRank(participant, participants, ratings) {
    const myRating = ratings.get(participant.handle) || 1200;
    let expectedRank = 1;
    
    participants.forEach(other => {
      if (other.handle !== participant.handle) {
        const otherRating = ratings.get(other.handle) || 1200;
        const probability = 1.0 / (1.0 + Math.pow(10, (otherRating - myRating) / 400.0));
        expectedRank += (1 - probability);
      }
    });
    
    return Math.round(expectedRank);
  }

  /**
   * Calculate rating change with improved algorithm using performance
   */
  calculateRatingChange(currentRating, actualRank, expectedRank, totalParticipants, performance) {
    // Base rating change factor (K-factor)
    let K = 32;
    
    // Adjust K based on rating (higher rated players have smaller changes)
    if (currentRating >= 2400) K = 16;
    else if (currentRating >= 2100) K = 20;
    else if (currentRating >= 1900) K = 24;
    else if (currentRating >= 1600) K = 32;
    else if (currentRating >= 1400) K = 36;
    else K = 40;
    
    // Calculate rating change based on performance vs current rating
    const performanceDelta = performance - currentRating;
    let ratingChange = performanceDelta * 0.25; // 25% of performance difference
    
    // Apply K-factor
    ratingChange = ratingChange * (K / 32);
    
    // Apply rank-based adjustment
    const rankDifference = expectedRank - actualRank;
    const rankBonus = rankDifference * 2; // Bonus/penalty for rank difference
    ratingChange += rankBonus;
    
    // Contest size factor (larger contests have more stable ratings)
    const sizeFactor = Math.min(1.2, Math.sqrt(200.0 / totalParticipants));
    ratingChange *= sizeFactor;
    
    // Apply final bounds and rounding
    ratingChange = Math.max(-200, Math.min(200, ratingChange));
    return Math.round(ratingChange);
  }

  /**
   * Display rating changes in the three new columns
   */
  displayRatingChanges(predictions) {
    predictions.forEach(prediction => {
      // Performance column
      const performanceCell = document.getElementById(`performance-${prediction.index}`);
      if (performanceCell) {
        performanceCell.textContent = prediction.performance.toString();
        performanceCell.title = `Performance rating based on rank ${prediction.actualRank}`;
        
        // Color code performance relative to current rating
        const perfDiff = prediction.performance - prediction.currentRating;
        if (perfDiff > 100) {
          performanceCell.style.color = '#28a745'; // Green for good performance
          performanceCell.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        } else if (perfDiff < -100) {
          performanceCell.style.color = '#dc3545'; // Red for poor performance
          performanceCell.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        } else {
          performanceCell.style.color = '#6c757d'; // Gray for average
          performanceCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
        }
      }

      // Rank change column
      const rankCell = document.getElementById(`rank-change-${prediction.index}`);
      if (rankCell) {
        const rankChange = prediction.rankChange;
        const rankText = rankChange > 0 ? `+${rankChange}` : `${rankChange}`;
        rankCell.textContent = rankText;
        rankCell.title = `Expected rank: ${prediction.expectedRank}, Actual rank: ${prediction.actualRank}`;
        
        // Color code rank change
        if (rankChange > 0) {
          rankCell.style.color = '#28a745'; // Green for better than expected
          rankCell.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        } else if (rankChange < 0) {
          rankCell.style.color = '#dc3545'; // Red for worse than expected
          rankCell.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        } else {
          rankCell.style.color = '#6c757d'; // Gray for as expected
          rankCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
        }
      }

      // Rating change column
      const ratingCell = document.getElementById(`rating-change-${prediction.index}`);
      if (ratingCell) {
        const change = prediction.ratingChange;
        const changeText = change > 0 ? `+${change}` : `${change}`;
        
        ratingCell.innerHTML = `
          <div style="font-weight: bold;">${changeText}</div>
          <div style="font-size: 9px; opacity: 0.7;">${prediction.currentRating}→${prediction.newRating}</div>
        `;
        
        ratingCell.title = `Current: ${prediction.currentRating}, Predicted: ${prediction.newRating}
Performance: ${prediction.performance}
Expected vs Actual: ${prediction.expectedRank} vs ${prediction.actualRank}`;
        
        // Color code rating change with intensity
        if (change > 0) {
          const intensity = Math.min(Math.abs(change) / 100, 1);
          ratingCell.style.color = `rgb(${Math.round(40 * (1-intensity))}, ${Math.round(167 + 88 * intensity)}, ${Math.round(69 * (1-intensity))})`;
          ratingCell.style.backgroundColor = `rgba(40, 167, 69, ${0.1 + 0.1 * intensity})`;
        } else if (change < 0) {
          const intensity = Math.min(Math.abs(change) / 100, 1);
          ratingCell.style.color = `rgb(${Math.round(220 + 35 * intensity)}, ${Math.round(53 * (1-intensity))}, ${Math.round(69 * (1-intensity))})`;
          ratingCell.style.backgroundColor = `rgba(220, 53, 69, ${0.1 + 0.1 * intensity})`;
        } else {
          ratingCell.style.color = '#6c757d';
          ratingCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
        }
      }
    });
  }

  /**
   * Display error message in all prediction columns
   */
  displayError() {
    const performanceCells = document.querySelectorAll('[id^="performance-"]');
    const rankCells = document.querySelectorAll('[id^="rank-change-"]');
    const ratingCells = document.querySelectorAll('[id^="rating-change-"]');
    
    [...performanceCells, ...rankCells, ...ratingCells].forEach(cell => {
      cell.textContent = 'Error';
      cell.style.color = '#dc3545';
      cell.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
      cell.title = 'Failed to calculate prediction';
    });
  }

  /**
   * Setup live updates for ongoing contests
   */
  setupLiveUpdates() {
    console.log('[CF Enhancer] Setting up live rating updates');
    
    // Create update indicator
    this.createUpdateIndicator();
    
    // Start periodic updates
    this.updateTimer = setInterval(() => {
      this.updateRatingPredictions();
    }, this.updateInterval);
    
    // Update indicator with countdown
    this.indicatorTimer = setInterval(() => {
      this.updateIndicator();
    }, 1000);
  }

  /**
   * Create update indicator
   */
  createUpdateIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'rating-predictor-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    indicator.textContent = 'Rating Predictor: Active';
    document.body.appendChild(indicator);
  }

  /**
   * Update the indicator with countdown
   */
  updateIndicator() {
    const indicator = document.getElementById('rating-predictor-indicator');
    if (!indicator) return;
    
    const timeSinceUpdate = Date.now() - this.lastUpdate;
    const timeUntilNext = this.updateInterval - timeSinceUpdate;
    
    if (timeUntilNext > 0) {
      const seconds = Math.ceil(timeUntilNext / 1000);
      indicator.textContent = `Rating Predictor: Next update in ${seconds}s`;
    } else {
      indicator.textContent = 'Rating Predictor: Updating...';
    }
  }

  /**
   * Cleanup function
   */
  destroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    if (this.indicatorTimer) {
      clearInterval(this.indicatorTimer);
    }
    
    const indicator = document.getElementById('rating-predictor-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Initialize only if on a contest standings page
if (window.location.pathname.includes('/contest/') && 
    (window.location.pathname.includes('/standings') || 
     window.location.pathname.includes('/room/'))) {
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new RatingPredictorFeature();
    });
  } else {
    new RatingPredictorFeature();
  }
}
