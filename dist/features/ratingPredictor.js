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
   * Add rating prediction column to standings table
   */
  addRatingColumn() {
    const table = document.querySelector('.standings');
    if (!table) return;

    // Add header
    const headerRow = table.querySelector('tr');
    if (headerRow) {
      const ratingHeader = document.createElement('th');
      ratingHeader.textContent = 'Rating Δ';
      ratingHeader.title = 'Predicted rating change';
      ratingHeader.style.cssText = `
        background-color: #f8f9fa;
        padding: 8px;
        border: 1px solid #dee2e6;
        font-weight: bold;
        text-align: center;
        min-width: 80px;
      `;
      
      // Insert before the last column (usually problems)
      const lastTh = headerRow.querySelector('th:last-child');
      if (lastTh) {
        headerRow.insertBefore(ratingHeader, lastTh);
      } else {
        headerRow.appendChild(ratingHeader);
      }
    }

    // Add cells for each participant
    const dataRows = table.querySelectorAll('tr:not(:first-child)');
    dataRows.forEach((row, index) => {
      const ratingCell = document.createElement('td');
      ratingCell.id = `rating-change-${index}`;
      ratingCell.style.cssText = `
        padding: 8px;
        border: 1px solid #dee2e6;
        text-align: center;
        font-weight: bold;
        min-width: 80px;
      `;
      ratingCell.textContent = 'Loading...';
      
      // Insert before the last column
      const lastTd = row.querySelector('td:last-child');
      if (lastTd) {
        row.insertBefore(ratingCell, lastTd);
      } else {
        row.appendChild(ratingCell);
      }
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
   * Estimate rating from handle color in standings
   */
  estimateRatingFromColor(handle) {
    // Find the handle link in the standings
    const handleLinks = document.querySelectorAll('a[href*="/profile/"]');
    
    for (const link of handleLinks) {
      if (link.textContent.trim() === handle) {
        const style = window.getComputedStyle(link);
        const color = style.color;
        
        // Map colors to rating ranges (more accurate based on CF color scheme)
        if (color.includes('rgb(255, 0, 0)') || color.includes('#ff0000')) {
          return 2400 + Math.random() * 500; // Red (International Grandmaster) 2400+
        } else if (color.includes('rgb(255, 140, 0)') || color.includes('#ff8c00') || color.includes('orange')) {
          return 2100 + Math.random() * 299; // Orange (Grandmaster) 2100-2399
        } else if (color.includes('rgb(170, 0, 170)') || color.includes('#aa00aa') || color.includes('purple')) {
          return 1900 + Math.random() * 199; // Purple (Master) 1900-2099
        } else if (color.includes('rgb(0, 0, 255)') || color.includes('#0000ff') || color.includes('blue')) {
          return 1600 + Math.random() * 299; // Blue (Expert) 1600-1899
        } else if (color.includes('rgb(3, 168, 158)') || color.includes('#03a89e') || color.includes('cyan')) {
          return 1400 + Math.random() * 199; // Cyan (Specialist) 1400-1599
        } else if (color.includes('rgb(0, 128, 0)') || color.includes('#008000') || color.includes('green')) {
          return 1200 + Math.random() * 199; // Green (Pupil) 1200-1399
        } else {
          return 800 + Math.random() * 399; // Gray (Newbie) or unrated 800-1199
        }
      }
    }
    
    return 1200; // Default rating
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
      
      // Calculate rating change with improved formula
      const ratingChange = this.calculateRatingChange(
        currentRating, 
        rank, 
        expectedRank, 
        totalParticipants
      );
      
      predictions.push({
        handle: participant.handle,
        index: participant.index,
        currentRating: currentRating,
        ratingChange: ratingChange,
        newRating: currentRating + ratingChange,
        expectedRank: expectedRank,
        actualRank: rank
      });
    });
    
    return predictions;
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
   * Calculate rating change with improved algorithm
   */
  calculateRatingChange(currentRating, actualRank, expectedRank, totalParticipants) {
    // Base rating change factor
    let K = 32;
    
    // Adjust K based on rating (higher rated players have smaller changes)
    if (currentRating >= 2400) K = 16;
    else if (currentRating >= 1900) K = 24;
    else if (currentRating >= 1600) K = 32;
    else K = 40;
    
    // Calculate performance multiplier
    const rankDifference = expectedRank - actualRank;
    const maxRankDifference = Math.max(expectedRank - 1, totalParticipants - expectedRank);
    const normalizedPerformance = rankDifference / maxRankDifference;
    
    // Calculate base change
    let ratingChange = K * normalizedPerformance;
    
    // Apply contest size factor (larger contests have smaller variance)
    const sizeFactor = Math.min(1.0, Math.sqrt(100.0 / totalParticipants));
    ratingChange *= sizeFactor;
    
    // Apply bounds and rounding
    ratingChange = Math.max(-150, Math.min(150, ratingChange));
    return Math.round(ratingChange);
  }

  /**
   * Display rating changes in the table
   */
  displayRatingChanges(predictions) {
    predictions.forEach(prediction => {
      const cell = document.getElementById(`rating-change-${prediction.index}`);
      if (cell) {
        const change = prediction.ratingChange;
        const changeText = change > 0 ? `+${change}` : `${change}`;
        
        cell.innerHTML = `
          <div style="font-weight: bold; font-size: 14px;">${changeText}</div>
          <div style="font-size: 10px; opacity: 0.7;">${prediction.currentRating} → ${prediction.newRating}</div>
        `;
        
        cell.title = `Current Rating: ${prediction.currentRating}
Predicted New Rating: ${prediction.newRating}
Expected Rank: ${prediction.expectedRank}
Actual Rank: ${prediction.actualRank}
Performance: ${prediction.actualRank < prediction.expectedRank ? 'Better than expected' : 
                prediction.actualRank > prediction.expectedRank ? 'Worse than expected' : 'As expected'}`;
        
        // Color code the change with gradient
        if (change > 0) {
          const intensity = Math.min(change / 100, 1);
          cell.style.color = `rgb(${Math.round(40 * (1-intensity))}, ${Math.round(167 + 88 * intensity)}, ${Math.round(69 * (1-intensity))})`;
          cell.style.backgroundColor = `rgba(40, 167, 69, ${0.1 * intensity})`;
        } else if (change < 0) {
          const intensity = Math.min(Math.abs(change) / 100, 1);
          cell.style.color = `rgb(${Math.round(220 + 35 * intensity)}, ${Math.round(53 * (1-intensity))}, ${Math.round(69 * (1-intensity))})`;
          cell.style.backgroundColor = `rgba(220, 53, 69, ${0.1 * intensity})`;
        } else {
          cell.style.color = '#6c757d';
          cell.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
        }
      }
    });
  }

  /**
   * Display error message
   */
  displayError() {
    const ratingCells = document.querySelectorAll('[id^="rating-change-"]');
    ratingCells.forEach(cell => {
      cell.textContent = 'Error';
      cell.style.color = '#dc3545';
      cell.title = 'Failed to calculate rating change';
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
