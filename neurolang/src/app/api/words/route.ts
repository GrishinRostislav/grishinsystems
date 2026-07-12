import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FSRSScheduler, FSRSRating } from "@/lib/fsrs";
import { ensureInitialized } from "@/lib/initializer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const dueOnly = searchParams.get("due") === "true";

    const { activePair } = await ensureInitialized();
    if (!activePair) {
      return NextResponse.json([]);
    }

    const whereClause: any = {
      languagePairId: activePair.id,
    };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (dueOnly) {
      whereClause.OR = [
        { whenRepeat: { lte: new Date() } },
        { whenRepeat: null },
      ];
    }

    const words = await prisma.word.findMany({
      where: whereClause,
      orderBy: { whenAdded: "desc" },
    });

    return NextResponse.json(words);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🟢 Add new word (with simple translation / OpenAI logic)
export async function POST(req: Request) {
  try {
    const { origin, translate, category } = await req.json();

    const { activePair } = await ensureInitialized();
    if (!activePair) {
      return NextResponse.json({ error: "No active language pair" }, { status: 400 });
    }

    let finalTranslate = translate;
    if (!finalTranslate) {
      finalTranslate = `[Translation of ${origin}]`;
    }

    const word = await prisma.word.create({
      data: {
        languagePairId: activePair.id,
        origin,
        translate: finalTranslate,
        category: category || "General",
        whenRepeat: new Date(), // Due immediately
      },
    });

    return NextResponse.json(word);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🟢 Grade / Review Word
export async function PUT(req: Request) {
  try {
    const { id, mistakes, forceTomorrow } = await req.json();
    const word = await prisma.word.findUnique({ where: { id } });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const now = new Date();
    const scheduler = FSRSScheduler.getInstance();

    const currentInterval = word.lastInterval || 0.0;
    const isGraduated = word.fsrsStability !== null && currentInterval >= 2879; // ~48h graduation limit

    let nextInterval = currentInterval;
    let nextStability = word.fsrsStability;
    let nextDifficulty = word.fsrsDifficulty;
    let nextState = word.fsrsState;
    let nextReview = now;

    if (!isGraduated) {
      // 🟢 Swift code "Zero Level" recovery & growth ladder logic
      if (mistakes > 0) {
        if (currentInterval <= 0) {
          nextInterval = 120; // 2 hours
        } else if (currentInterval >= 1440) {
          nextInterval = 720; // drop to 12h
        } else {
          nextInterval = Math.max(120, currentInterval / 2.0);
        }
      } else {
        if (currentInterval < 1) {
          nextInterval = 120; // 2 hours
        } else if (currentInterval < 1440) {
          nextInterval = 1440; // 24h
        } else if (currentInterval < 2880) {
          nextInterval = 2880; // 48h
        } else {
          // Graduate to FSRS
          const fsrsInit = scheduler.initialMemoryState(FSRSRating.GOOD);
          nextStability = fsrsInit.stability;
          nextDifficulty = fsrsInit.difficulty;
          nextState = 2; // Review state
          nextInterval = scheduler.nextInterval(fsrsInit.stability) * 1440.0;
        }
      }

      nextReview = new Date(now.getTime() + nextInterval * 60 * 1000);
    } else {
      // 🟢 Standard FSRS calculations
      const rating = mistakes === 0 ? FSRSRating.GOOD : FSRSRating.HARD;
      const elapsedDays = word.fsrsLastReview
        ? Math.max(0, (now.getTime() - new Date(word.fsrsLastReview).getTime()) / 86400000.0)
        : 0;

      const fsrsUpdate = scheduler.nextMemoryState(
        word.fsrsStability || 2.5,
        word.fsrsDifficulty || 5.0,
        elapsedDays,
        rating
      );

      nextStability = fsrsUpdate.stability;
      nextDifficulty = fsrsUpdate.difficulty;
      
      const nextDays = scheduler.nextInterval(nextStability);
      nextInterval = nextDays * 1440.0;
      nextReview = new Date(now.getTime() + nextInterval * 60 * 1000);
    }

    // Constrain to snap review window: snap to 18:00 if review is late
    if (nextReview.getHours() >= 18) {
      nextReview.setHours(18, 0, 0, 0);
    }

    // Goal override: Force tomorrow if goal reached
    if (forceTomorrow) {
      const today = new Date();
      if (nextReview.toDateString() === today.toDateString()) {
        nextReview = new Date(nextReview.getTime() + 86400 * 1000);
        nextReview.setHours(18, 0, 0, 0);
        nextInterval += 1440.0;
      }
    }

    const updatedWord = await prisma.word.update({
      where: { id },
      data: {
        lastRepeat: now,
        whenRepeat: nextReview,
        lastInterval: nextInterval,
        fsrsStability: nextStability,
        fsrsDifficulty: nextDifficulty,
        fsrsLastReview: now,
        fsrsState: nextState,
        reviewAttempts: { increment: 1 },
        reviewSuccesses: { increment: mistakes === 0 ? 1 : 0 },
        rightAnswer: { increment: mistakes === 0 ? 1 : 0 },
        wrongAnswer: { increment: mistakes > 0 ? 1 : 0 },
        wordPoints: { increment: mistakes === 0 ? 1.0 : 0.0 },
      },
    });

    return NextResponse.json(updatedWord);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
