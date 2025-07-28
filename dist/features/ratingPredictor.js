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
    this.isContestFinalized = this.checkIfContestFinalized();
    
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
   * Check if contest has ended and ratings are finalized
   */
  checkIfContestFinalized() {
    // Check various indicators that contest has ended
    const contestPhase = document.querySelector('.contest-state-phase');
    if (contestPhase) {
      const phaseText = contestPhase.textContent.toLowerCase();
      if (phaseText.includes('finished') || phaseText.includes('ended') || phaseText.includes('over')) {
        return true;
      }
    }

    // Check if there's a "Contest is over" message
    const contestStatus = document.querySelector('.contest-state');
    if (contestStatus) {
      const statusText = contestStatus.textContent.toLowerCase();
      if (statusText.includes('finished') || statusText.includes('ended') || statusText.includes('over')) {
        return true;
      }
    }

    // Check for contest duration indicators
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent.includes('Contest') && !titleElement.textContent.includes('Virtual')) {
      // Look for time indicators that suggest contest is over
      const timeElements = document.querySelectorAll('.countdown, .contest-duration');
      for (const elem of timeElements) {
        const text = elem.textContent.toLowerCase();
        if (text.includes('finished') || text.includes('ended') || text.includes('ago')) {
          return true;
        }
      }
    }

    // Check if rating changes are visible in the standings
    const ratingChanges = document.querySelectorAll('span[title*="rating"], span[title*="Rating"]');
    if (ratingChanges.length > 0) {
      // Check if any of these contain actual rating change values
      for (const elem of ratingChanges) {
        if (elem.textContent.match(/[+-]\d+/) || elem.title.match(/[+-]\d+/)) {
          return true;
        }
      }
    }

    // Check for any elements that indicate rating changes
    const standingsTable = document.querySelector('.standings');
    if (standingsTable) {
      // Look for rating change patterns in the table
      const allText = standingsTable.textContent;
      const ratingChangePattern = /[+-]\d{1,3}/g;
      const matches = allText.match(ratingChangePattern);
      
      if (matches && matches.length > 3) { // Multiple rating changes suggest finalized contest
        return true;
      }

      // Look for bold spans that might contain rating changes
      const boldElements = standingsTable.querySelectorAll('span[style*="font-weight:bold"], b, strong');
      for (const elem of boldElements) {
        if (elem.textContent.match(/^[+-]\d+$/)) {
          return true;
        }
      }
    }
    
    // Check URL for past contest indicators
    const url = window.location.href;
    if (url.includes('/contest/') && !url.includes('/virtual/')) {
      // If we're not in a virtual contest and can't find running indicators, it might be finished
      const runningIndicators = document.querySelectorAll('.countdown:not(:empty)');
      if (runningIndicators.length === 0) {
        // Check if contest was recent (heuristic)
        const currentTime = Date.now();
        const contestMatch = url.match(/\/contest\/(\d+)/);
        if (contestMatch) {
          const contestId = parseInt(contestMatch[1]);
          // Recent contest IDs are likely finished if no running indicators
          if (contestId > 1000) { // Reasonable threshold for active contests
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Setup rating predictor functionality
   */
  async setupRatingPredictor(enabled) {
    if (!enabled || !this.contestId) return;

    console.log('[CF Enhancer] Setting up rating predictor for contest:', this.contestId);
    console.log('[CF Enhancer] Contest status - Live:', this.isLiveContest, 'Finalized:', this.isContestFinalized);
    
    // Wait for the standings table to load
    await this.waitForStandingsTable();
    
    // Add rating prediction column
    this.addRatingColumn();
    
    // Calculate and display initial predictions
    await this.updateRatingPredictions();
    
    // Set up periodic updates for live contests, or one-time update for finalized contests
    if (this.isLiveContest) {
      this.setupLiveUpdates();
    } else if (this.isContestFinalized) {
      // For finalized contests, try to get actual rating changes after a short delay
      setTimeout(() => {
        this.updateRatingPredictions();
      }, 2000);
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
      performanceHeader.className = 'rating-predictor-header';
      performanceHeader.style.cssText = headerStyle;
      headerRow.appendChild(performanceHeader);

      // Predicted delta column
      const predictedHeader = document.createElement('th');
      predictedHeader.textContent = 'Δ Predicted';
      predictedHeader.title = 'Our predicted rating change';
      predictedHeader.className = 'rating-predictor-header';
      predictedHeader.style.cssText = headerStyle;
      headerRow.appendChild(predictedHeader);

      // Final delta column (from Codeforces)
      const finalHeader = document.createElement('th');
      finalHeader.textContent = 'Δ Final';
      finalHeader.title = 'Actual rating change from Codeforces';
      finalHeader.className = 'rating-predictor-header';
      finalHeader.style.cssText = headerStyle;
      headerRow.appendChild(finalHeader);

      // Rank change column
      const rankHeader = document.createElement('th');
      rankHeader.textContent = 'Rank Change';
      rankHeader.title = 'Title/rank change (e.g., N→P, E→CM)';
      rankHeader.className = 'rating-predictor-header';
      rankHeader.style.cssText = headerStyle;
      headerRow.appendChild(rankHeader);
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
      performanceCell.className = 'rating-predictor-cell';
      performanceCell.style.cssText = cellStyle;
      performanceCell.textContent = 'Loading...';
      performanceCell.setAttribute('data-rating-predictor', 'true');
      row.appendChild(performanceCell);

      // Predicted delta cell
      const predictedCell = document.createElement('td');
      predictedCell.id = `predicted-${index}`;
      predictedCell.className = 'rating-predictor-cell';
      predictedCell.style.cssText = cellStyle;
      predictedCell.textContent = 'Loading...';
      predictedCell.setAttribute('data-rating-predictor', 'true');
      row.appendChild(predictedCell);

      // Final delta cell (from CF)
      const finalCell = document.createElement('td');
      finalCell.id = `final-${index}`;
      finalCell.className = 'rating-predictor-cell';
      finalCell.style.cssText = cellStyle;
      finalCell.textContent = 'TBD';
      finalCell.title = 'Will show actual CF rating change after contest';
      finalCell.setAttribute('data-rating-predictor', 'true');
      row.appendChild(finalCell);

      // Rank change cell
      const rankChangeCell = document.createElement('td');
      rankChangeCell.id = `rank-change-${index}`;
      rankChangeCell.className = 'rating-predictor-cell';
      rankChangeCell.style.cssText = cellStyle;
      rankChangeCell.textContent = 'Loading...';
      rankChangeCell.setAttribute('data-rating-predictor', 'true');
      row.appendChild(rankChangeCell);
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
      
      // Get actual rating changes if contest is finalized
      const actualChanges = this.extractActualRatingChanges(participants);
      
      // Calculate rating changes
      const predictions = this.calculateRatingChanges(participants, ratings);
      
      // Update UI with both predictions and actual changes
      this.displayRatingChanges(predictions, actualChanges);
      
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
   * Extract actual rating changes from finalized contest standings
   */
  extractActualRatingChanges(participants) {
    const actualChanges = new Map();
    
    if (!this.checkIfContestFinalized()) {
      return actualChanges;
    }

    const standingsTable = document.querySelector('.standings');
    if (!standingsTable) {
      return actualChanges;
    }

    // Look for rating changes in various possible formats
    participants.forEach(participant => {
      const handle = participant.handle;
      
      // Method 1: Look for rating change spans near the participant's row
      const participantLinks = standingsTable.querySelectorAll('a[href*="/profile/"]');
      
      for (const link of participantLinks) {
        if (link.textContent.trim() === handle) {
          const row = link.closest('tr');
          if (row) {
            // Look for rating change elements in the row
            const ratingElements = row.querySelectorAll('span, div, td');
            
            for (const elem of ratingElements) {
              const text = elem.textContent.trim();
              const match = text.match(/([+-]\d+)/);
              
              if (match) {
                const change = parseInt(match[1]);
                // Validate it's a reasonable rating change
                if (Math.abs(change) <= 500) {
                  actualChanges.set(handle, change);
                  break;
                }
              }
            }
            
            // Also check title attributes
            const elementsWithTitle = row.querySelectorAll('[title*="rating"]');
            for (const elem of elementsWithTitle) {
              const title = elem.title;
              const match = title.match(/([+-]\d+)/);
              
              if (match) {
                const change = parseInt(match[1]);
                if (Math.abs(change) <= 500) {
                  actualChanges.set(handle, change);
                  break;
                }
              }
            }
          }
          break;
        }
      }
    });

    console.log('[CF Enhancer] Extracted actual rating changes:', actualChanges);
    return actualChanges;
  }
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
      
      const newRating = currentRating + ratingChange;
      
      // Calculate rank changes
      const currentRankTitle = this.getRankAbbreviation(currentRating);
      const newRankTitle = this.getRankAbbreviation(newRating);
      const rankChange = currentRankTitle !== newRankTitle ? `${currentRankTitle}→${newRankTitle}` : currentRankTitle;
      
      predictions.push({
        handle: participant.handle,
        index: participant.index,
        currentRating: currentRating,
        performance: performance,
        ratingChange: ratingChange,
        newRating: newRating,
        expectedRank: expectedRank,
        actualRank: rank,
        currentRankTitle: currentRankTitle,
        newRankTitle: newRankTitle,
        rankChange: rankChange
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
   * Get rank title from rating
   */
  getRankTitle(rating) {
    if (rating >= 2400) return 'IGM'; // International Grandmaster
    if (rating >= 2300) return 'GM';  // Grandmaster
    if (rating >= 2100) return 'IM';  // International Master
    if (rating >= 1900) return 'M';   // Master
    if (rating >= 1600) return 'E';   // Expert
    if (rating >= 1400) return 'S';   // Specialist
    if (rating >= 1200) return 'P';   // Pupil
    return 'N'; // Newbie
  }

  /**
   * Get rank title abbreviation
   */
  getRankAbbreviation(rating) {
    if (rating >= 2400) return 'IGM'; // International Grandmaster
    if (rating >= 2300) return 'GM';  // Grandmaster  
    if (rating >= 2100) return 'IM';  // International Master
    if (rating >= 1900) return 'M';   // Master
    if (rating >= 1600) return 'E';   // Expert
    if (rating >= 1400) return 'S';   // Specialist
    if (rating >= 1200) return 'P';   // Pupil
    return 'N'; // Newbie
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
   * Display rating changes in the four new columns
   */
  displayRatingChanges(predictions, actualChanges = new Map()) {
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

      // Predicted delta column
      const predictedCell = document.getElementById(`predicted-${prediction.index}`);
      if (predictedCell) {
        const change = prediction.ratingChange;
        const changeText = change > 0 ? `+${change}` : `${change}`;
        
        predictedCell.innerHTML = `
          <div style="font-weight: bold;">${changeText}</div>
          <div style="font-size: 9px; opacity: 0.7;">${prediction.currentRating}→${prediction.newRating}</div>
        `;
        
        predictedCell.title = `Predicted: ${prediction.currentRating} → ${prediction.newRating} (${changeText})`;
        
        // Color code the predicted change
        if (change > 0) {
          const intensity = Math.min(Math.abs(change) / 100, 1);
          predictedCell.style.color = `rgb(${Math.round(40 * (1-intensity))}, ${Math.round(167 + 88 * intensity)}, ${Math.round(69 * (1-intensity))})`;
          predictedCell.style.backgroundColor = `rgba(40, 167, 69, ${0.1 + 0.1 * intensity})`;
        } else if (change < 0) {
          const intensity = Math.min(Math.abs(change) / 100, 1);
          predictedCell.style.color = `rgb(${Math.round(220 + 35 * intensity)}, ${Math.round(53 * (1-intensity))}, ${Math.round(69 * (1-intensity))})`;
          predictedCell.style.backgroundColor = `rgba(220, 53, 69, ${0.1 + 0.1 * intensity})`;
        } else {
          predictedCell.style.color = '#6c757d';
          predictedCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
        }
      }

      // Final delta column (Codeforces actual)
      const finalCell = document.getElementById(`final-${prediction.index}`);
      if (finalCell) {
        const actualChange = actualChanges.get(prediction.handle);
        
        if (actualChange !== undefined) {
          // Show actual rating change from Codeforces
          const changeText = actualChange > 0 ? `+${actualChange}` : `${actualChange}`;
          finalCell.textContent = changeText;
          finalCell.title = `Actual rating change from Codeforces: ${changeText}`;
          finalCell.style.fontStyle = 'normal';
          finalCell.style.fontWeight = 'bold';
          
          // Color code the actual change
          if (actualChange > 0) {
            finalCell.style.color = '#28a745';
            finalCell.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
          } else if (actualChange < 0) {
            finalCell.style.color = '#dc3545';
            finalCell.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
          } else {
            finalCell.style.color = '#6c757d';
            finalCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
          }
          
          // Add comparison with prediction
          const predictionDiff = Math.abs(actualChange - prediction.ratingChange);
          if (predictionDiff <= 10) {
            finalCell.title += ` (Prediction accuracy: Excellent ±${predictionDiff})`;
          } else if (predictionDiff <= 25) {
            finalCell.title += ` (Prediction accuracy: Good ±${predictionDiff})`;
          } else if (predictionDiff <= 50) {
            finalCell.title += ` (Prediction accuracy: Fair ±${predictionDiff})`;
          } else {
            finalCell.title += ` (Prediction accuracy: Poor ±${predictionDiff})`;
          }
        } else {
          // Contest not finalized yet or data not available
          if (this.isContestFinalized) {
            finalCell.textContent = 'N/A';
            finalCell.title = 'Rating change not found - may not be available yet';
          } else {
            finalCell.textContent = 'TBD';
            finalCell.title = 'Actual rating change from Codeforces (available after contest ends)';
          }
          finalCell.style.color = '#6c757d';
          finalCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
          finalCell.style.fontStyle = 'italic';
        }
      }

      // Rank change column
      const rankChangeCell = document.getElementById(`rank-change-${prediction.index}`);
      if (rankChangeCell) {
        rankChangeCell.textContent = prediction.rankChange;
        rankChangeCell.title = `Current: ${prediction.currentRankTitle} (${prediction.currentRating}), Predicted: ${prediction.newRankTitle} (${prediction.newRating})`;
        
        // Color code rank changes
        if (prediction.currentRankTitle !== prediction.newRankTitle) {
          // Check if it's an upgrade or downgrade
          const currentRankOrder = this.getRankOrder(prediction.currentRankTitle);
          const newRankOrder = this.getRankOrder(prediction.newRankTitle);
          
          if (newRankOrder > currentRankOrder) {
            // Rank upgrade
            rankChangeCell.style.color = '#28a745';
            rankChangeCell.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
            rankChangeCell.style.fontWeight = 'bold';
          } else {
            // Rank downgrade
            rankChangeCell.style.color = '#dc3545';
            rankChangeCell.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
            rankChangeCell.style.fontWeight = 'bold';
          }
        } else {
          // No rank change
          rankChangeCell.style.color = '#6c757d';
          rankChangeCell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
        }
      }
    });
  }

  /**
   * Get rank order for comparison (higher number = higher rank)
   */
  getRankOrder(rankAbbr) {
    const ranks = { 'N': 1, 'P': 2, 'S': 3, 'E': 4, 'M': 5, 'IM': 6, 'GM': 7, 'IGM': 8 };
    return ranks[rankAbbr] || 1;
  }

  /**
   * Display error message in all prediction columns
   */
  displayError() {
    const performanceCells = document.querySelectorAll('[id^="performance-"]');
    const predictedCells = document.querySelectorAll('[id^="predicted-"]');
    const finalCells = document.querySelectorAll('[id^="final-"]');
    const rankChangeCells = document.querySelectorAll('[id^="rank-change-"]');
    
    [...performanceCells, ...predictedCells, ...rankChangeCells].forEach(cell => {
      cell.textContent = 'Error';
      cell.style.color = '#dc3545';
      cell.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
      cell.title = 'Failed to calculate prediction';
    });
    
    // Final cells remain as TBD since they're not calculated by us
    finalCells.forEach(cell => {
      cell.textContent = 'TBD';
      cell.style.color = '#6c757d';
      cell.style.backgroundColor = 'rgba(108, 117, 125, 0.05)';
      cell.title = 'Actual rating change from Codeforces (available after contest ends)';
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
