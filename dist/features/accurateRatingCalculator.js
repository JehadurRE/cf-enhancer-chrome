/**
 * Accurate Rating Predictor for Codeforces
 * Adapted from Carrot (https://github.com/meooow25/carrot) by meooow25
 * 
 * Original algorithm from TLE by algmyr, based on Mike Mirzayanov's code
 * https://github.com/cheran-senthil/TLE/blob/master/tle/util/ranklist/rating_calculator.py
 * https://codeforces.com/contest/1/submission/13861109
 * 
 * Credit: This implementation is based on the excellent work by meooow25 in the Carrot extension.
 * We gratefully acknowledge their contribution to the competitive programming community.
 */

class AccurateRatingCalculator {
  constructor() {
    this.DEFAULT_RATING = 1400;
    this.MAX_RATING_LIMIT = 6000;
    this.MIN_RATING_LIMIT = -500;
    this.RATING_RANGE_LEN = this.MAX_RATING_LIMIT - this.MIN_RATING_LIMIT;
    this.ELO_OFFSET = this.RATING_RANGE_LEN;
    this.RATING_OFFSET = -this.MIN_RATING_LIMIT;
    
    // Initialize ELO win probabilities
    this.initializeEloWinProbabilities();
    
    // Simple convolution for now (could be optimized with FFT)
    this.seed = null;
    this.adjustment = 0;
  }

  initializeEloWinProbabilities() {
    this.ELO_WIN_PROB = new Array(2 * this.RATING_RANGE_LEN + 1);
    for (let i = -this.RATING_RANGE_LEN; i <= this.RATING_RANGE_LEN; i++) {
      this.ELO_WIN_PROB[i + this.ELO_OFFSET] = 1 / (1 + Math.pow(10, i / 400));
    }
  }

  /**
   * Calculate rating changes for contestants
   * @param {Array} contestants - Array of contestant objects with {handle, points, penalty, rating}
   * @returns {Array} Results with delta and performance calculations
   */
  calculateRatingChanges(contestants) {
    // Convert to internal format
    this.contestants = contestants.map(c => ({
      handle: c.handle,
      points: c.points,
      penalty: c.penalty,
      rating: c.rating,
      effectiveRating: c.rating || this.DEFAULT_RATING,
      rank: null,
      delta: null,
      performance: null
    }));

    // Main calculation steps
    this.calcSeed();
    this.reassignRanks();
    this.calcDeltas();
    this.adjustDeltas();
    this.calcPerformances();

    // Return results
    return this.contestants.map(c => ({
      handle: c.handle,
      rating: c.rating,
      delta: c.delta,
      performance: c.performance,
      rank: c.rank,
      effectiveRating: c.effectiveRating
    }));
  }

  /**
   * Calculate seed values using convolution
   */
  calcSeed() {
    const counts = new Array(this.RATING_RANGE_LEN).fill(0);
    
    // Count contestants at each rating
    for (const c of this.contestants) {
      const index = c.effectiveRating + this.RATING_OFFSET;
      if (index >= 0 && index < this.RATING_RANGE_LEN) {
        counts[index] += 1;
      }
    }

    // Simple convolution (could be optimized with FFT)
    this.seed = this.convolve(this.ELO_WIN_PROB, counts);
    
    // Add 1 to get expected rank
    for (let i = 0; i < this.seed.length; i++) {
      this.seed[i] += 1;
    }
  }

  /**
   * Simple convolution implementation
   */
  convolve(a, b) {
    const result = new Array(a.length + b.length - 1).fill(0);
    
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        result[i + j] += a[i] * b[j];
      }
    }
    
    return result;
  }

  /**
   * Get expected rank (seed) for a rating
   */
  getSeed(rating, exclude) {
    const index = rating + this.ELO_OFFSET + this.RATING_OFFSET;
    if (index < 0 || index >= this.seed.length) {
      return 1;
    }
    
    const excludeIndex = rating - exclude + this.ELO_OFFSET;
    const excludeProb = (excludeIndex >= 0 && excludeIndex < this.ELO_WIN_PROB.length) 
      ? this.ELO_WIN_PROB[excludeIndex] 
      : 0;
    
    return this.seed[index] - excludeProb;
  }

  /**
   * Reassign ranks based on points and penalty
   */
  reassignRanks() {
    // Sort by points (descending) then penalty (ascending)
    this.contestants.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return a.penalty - b.penalty;
    });

    let lastPoints = null;
    let lastPenalty = null;
    let rank = null;
    
    for (let i = this.contestants.length - 1; i >= 0; i--) {
      const c = this.contestants[i];
      if (c.points !== lastPoints || c.penalty !== lastPenalty) {
        lastPoints = c.points;
        lastPenalty = c.penalty;
        rank = i + 1;
      }
      c.rank = rank;
    }
  }

  /**
   * Calculate rating delta for a contestant
   */
  calcDelta(contestant, assumedRating) {
    const seed = this.getSeed(assumedRating, contestant.effectiveRating);
    const midRank = Math.sqrt(contestant.rank * seed);
    const needRating = this.rankToRating(midRank, contestant.effectiveRating);
    return Math.trunc((needRating - assumedRating) / 2);
  }

  /**
   * Calculate deltas for all contestants
   */
  calcDeltas() {
    for (const c of this.contestants) {
      c.delta = this.calcDelta(c, c.effectiveRating);
    }
  }

  /**
   * Find rating corresponding to a rank using binary search
   */
  rankToRating(rank, selfRating) {
    let left = 2;
    let right = this.MAX_RATING_LIMIT;
    
    while (left < right) {
      const mid = Math.floor((left + right + 1) / 2);
      if (this.getSeed(mid, selfRating) >= rank) {
        left = mid;
      } else {
        right = mid - 1;
      }
    }
    
    return left;
  }

  /**
   * Adjust deltas to maintain rating system balance
   */
  adjustDeltas() {
    // Sort by effective rating (descending)
    this.contestants.sort((a, b) => b.effectiveRating - a.effectiveRating);
    
    const n = this.contestants.length;
    
    // First adjustment: overall balance
    {
      const deltaSum = this.contestants.reduce((sum, c) => sum + c.delta, 0);
      const inc = Math.trunc(-deltaSum / n) - 1;
      this.adjustment = inc;
      
      for (const c of this.contestants) {
        c.delta += inc;
      }
    }
    
    // Second adjustment: top players balance
    {
      const zeroSumCount = Math.min(4 * Math.round(Math.sqrt(n)), n);
      const topPlayersDeltaSum = this.contestants
        .slice(0, zeroSumCount)
        .reduce((sum, c) => sum + c.delta, 0);
      
      const inc = Math.min(Math.max(Math.trunc(-topPlayersDeltaSum / zeroSumCount), -10), 0);
      this.adjustment += inc;
      
      for (const c of this.contestants) {
        c.delta += inc;
      }
    }
  }

  /**
   * Calculate performance ratings using binary search
   */
  calcPerformances() {
    for (const c of this.contestants) {
      if (c.rank === 1) {
        c.performance = Infinity; // Rank 1 always gains rating
      } else {
        // Binary search for performance rating
        let left = this.MIN_RATING_LIMIT;
        let right = this.MAX_RATING_LIMIT;
        
        while (left < right) {
          const mid = Math.floor((left + right + 1) / 2);
          const delta = this.calcDelta(c, mid) + this.adjustment;
          
          if (delta <= 0) {
            left = mid;
          } else {
            right = mid - 1;
          }
        }
        
        c.performance = left;
      }
    }
  }
}

export default AccurateRatingCalculator;
