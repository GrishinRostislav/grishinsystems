export enum FSRSRating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export class FSRSScheduler {
  private static instance: FSRSScheduler;

  // FSRS v4.5 parameters
  private readonly w: number[] = [
    0.4, 0.6, 2.4, 5.8, // Initial stabilities
    4.93, 0.94, 0.86, 0.01, // Difficulty modifiers
    1.49, 0.14, 0.94, // Stability modifiers (Recovery)
    2.18, 0.05, 0.34, 1.26, // Stability modifiers (Review)
    0.29, 2.61 // Hard penalty & Easy bonus
  ];

  public static getInstance(): FSRSScheduler {
    if (!FSRSScheduler.instance) {
      FSRSScheduler.instance = new FSRSScheduler();
    }
    return FSRSScheduler.instance;
  }

  public initialMemoryState(rating: FSRSRating): { stability: number; difficulty: number } {
    const s = this.w[rating - 1];
    let d = this.w[4] - this.w[5] * (rating - 3);
    d = Math.max(1.0, Math.min(10.0, d));
    return { stability: s, difficulty: d };
  }

  public nextMemoryState(
    currentStability: number,
    currentDifficulty: number,
    actualIntervalDays: number,
    rating: FSRSRating
  ): { stability: number; difficulty: number } {
    let nextD = currentDifficulty - this.w[6] * (rating - 3);
    nextD = this.w[4] * this.w[7] + nextD * (1 - this.w[7]);
    nextD = Math.max(1.0, Math.min(10.0, nextD));

    let nextS = currentStability;

    if (rating === FSRSRating.AGAIN) {
      nextS = this.w[8] * Math.pow(currentDifficulty, -this.w[9]) * Math.pow(currentStability, this.w[10]);
    } else {
      const interval = Math.max(1.0, actualIntervalDays);
      const baseFactor =
        Math.exp(this.w[11]) *
        (11 - currentDifficulty) *
        Math.pow(currentStability, -this.w[12]) *
        (Math.exp(this.w[13] * interval / currentStability) - 1);

      let hardPenalty = 1.0;
      if (rating === FSRSRating.HARD) hardPenalty = this.w[14]; // note: index 14 is 0.34 in SwiftData, w[15] (which is index 14 in 0-based array w[14])

      let easyBonus = 1.0;
      if (rating === FSRSRating.EASY) easyBonus = this.w[15]; // index 15 is 1.26

      nextS = currentStability * (1 + baseFactor * hardPenalty * easyBonus);
    }

    return { stability: nextS, difficulty: nextD };
  }

  public nextInterval(stability: number, requestRetention: number = 0.9): number {
    const interval = stability * (Math.log(requestRetention) / Math.log(0.9));
    return Math.max(1.0, interval);
  }
}
