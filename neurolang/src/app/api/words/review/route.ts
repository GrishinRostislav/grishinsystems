import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { FSRSScheduler, Rating } from '@/lib/fsrs';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wordId, rating } = await req.json();

    if (!wordId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json({ error: 'Word ID and a valid rating (1-4) are required' }, { status: 400 });
    }

    const word = await prisma.word.findFirst({
      where: { id: wordId, userId: user.id },
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    let nextStability = 0;
    let nextDifficulty = 0;
    let nextState = 2; // Default to Review (2)

    if (word.state === 0) {
      // First time reviewing a new word
      const result = FSRSScheduler.initialMemoryState(rating as Rating);
      nextStability = result.stability;
      nextDifficulty = result.difficulty;
      nextState = rating === Rating.again ? 1 : 2; // 1 = Learning, 2 = Review
    } else {
      // Subsequent review
      const lastReviewDate = word.lastReview || word.createdAt;
      const elapsedDays = Math.max(0, Math.floor((Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)));

      const result = FSRSScheduler.nextMemoryState(
        word.stability,
        word.difficulty,
        elapsedDays,
        rating as Rating
      );
      nextStability = result.stability;
      nextDifficulty = result.difficulty;
      nextState = rating === Rating.again ? 3 : 2; // 3 = Relearning, 2 = Review
    }

    const intervalDays = FSRSScheduler.nextInterval(nextStability);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    // Calculate XP earned based on performance
    let xpEarned = 5;
    if (rating === Rating.good) xpEarned = 10;
    if (rating === Rating.easy) xpEarned = 15;
    if (rating === Rating.again) xpEarned = 2;

    // Update the Word model in database
    const updatedWord = await prisma.word.update({
      where: { id: wordId },
      data: {
        state: nextState,
        difficulty: nextDifficulty,
        stability: nextStability,
        elapsedDays: word.scheduledDays, // last scheduled days becomes elapsed days on next review
        scheduledDays: intervalDays,
        lastReview: new Date(),
        nextReview,
      },
    });

    // Update User XP & Streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActive: true, streak: true },
    });

    let newStreak = userProfile?.streak || 0;
    const lastActiveDate = userProfile?.lastActive ? new Date(userProfile.lastActive) : null;
    if (lastActiveDate) {
      lastActiveDate.setHours(0, 0, 0, 0);

      if (lastActiveDate.getTime() === yesterday.getTime()) {
        // Active yesterday, increment streak
        newStreak += 1;
      } else if (lastActiveDate.getTime() !== today.getTime()) {
        // Missed a day (not today, not yesterday), reset streak
        newStreak = 1;
      }
    } else {
      // First activity ever
      newStreak = 1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: xpEarned },
        streak: newStreak,
        lastActive: new Date(),
      },
    });

    // Record or update DailyStat
    const dailyStat = await prisma.dailyStat.findFirst({
      where: {
        userId: user.id,
        date: today,
      },
    });

    const isNewWord = word.state === 0 && rating !== Rating.again;

    if (dailyStat) {
      await prisma.dailyStat.update({
        where: { id: dailyStat.id },
        data: {
          xpEarned: { increment: xpEarned },
          wordsReviewed: { increment: 1 },
          wordsLearned: isNewWord ? { increment: 1 } : undefined,
        },
      });
    } else {
      await prisma.dailyStat.create({
        data: {
          userId: user.id,
          date: today,
          xpEarned,
          wordsReviewed: 1,
          wordsLearned: isNewWord ? 1 : 0,
        },
      });
    }

    return NextResponse.json({
      word: updatedWord,
      xpEarned,
      userXp: updatedUser.xp,
      streak: updatedUser.streak,
    });
  } catch (error) {
    console.error('Error processing word review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
