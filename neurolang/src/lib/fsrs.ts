export enum Rating {
  again = 1,
  hard = 2,
  good = 3,
  easy = 4,
}

export class FSRSScheduler {
  // Optimized weights from the Swift app (FSRS v4.5 approximation)
  private static w = [
    0.4, 0.6, 2.4, 5.8,      // Initial stabilities
    4.93, 0.94, 0.86, 0.01,  // Difficulty modifiers
    1.49, 0.14, 0.94,        // Stability modifiers (Recovery)
    2.18, 0.05, 0.34, 1.26,  // Stability modifiers (Review)
    0.29, 2.61               // Hard penalty & Easy bonus
  ];

  /**
   * Calculates the initial memory state for a new card.
   */
  static initialMemoryState(rating: Rating): { stability: number; difficulty: number } {
    const s = this.w[rating - 1];
    let d = this.w[4] - this.w[5] * (rating - 3);
    d = Math.max(1.0, Math.min(10.0, d));
    return { stability: s, difficulty: d };
  }

  /**
   * Calculates the next memory state (stability and difficulty) after a review.
   * @param currentStability Current stability of the word
   * @param currentDifficulty Current difficulty of the word
   * @param daysSinceLast Actual number of days elapsed since the last review
   * @param rating User rating of the recall (again, hard, good, easy)
   */
  static nextMemoryState(
    currentStability: number,
    currentDifficulty: number,
    daysSinceLast: number,
    rating: Rating
  ): { stability: number; difficulty: number } {
    // 1. Next Difficulty
    let nextD = currentDifficulty - this.w[6] * (rating - 3);
    // Mean reversion to initial difficulty mean
    nextD = this.w[4] * this.w[7] + nextD * (1 - this.w[7]);
    nextD = Math.max(1.0, Math.min(10.0, nextD));

    // 2. Next Stability
    let nextS = currentStability;

    if (rating === Rating.again) {
      // Forgot: S_next = w[8] * D^-w[9] * S^w[10]
      nextS = this.w[8] * Math.pow(currentDifficulty, -this.w[9]) * Math.pow(currentStability, this.w[10]);
    } else {
      // Remembered: S_next = S * (1 + baseFactor * hardPenalty * easyBonus)
      const interval = Math.max(1.0, daysSinceLast);
      const baseFactor =
        Math.exp(this.w[11]) *
        (11 - currentDifficulty) *
        Math.pow(currentStability, -this.w[12]) *
        (Math.exp((this.w[13] * interval) / currentStability) - 1);

      let hardPenalty = 1.0;
      if (rating === Rating.hard) hardPenalty = this.w[15];

      let easyBonus = 1.0;
      if (rating === Rating.easy) easyBonus = this.w[16];

      nextS = currentStability * (1 + baseFactor * hardPenalty * easyBonus);
    }

    return { stability: nextS, difficulty: nextD };
  }

  /**
   * Calculates the next review interval in days based on stability.
   */
  static nextInterval(stability: number, requestRetention = 0.9): number {
    const interval = stability * (Math.log(requestRetention) / Math.log(0.9));
    return Math.max(1.0, Math.round(interval)); // return integer days
  }
}
