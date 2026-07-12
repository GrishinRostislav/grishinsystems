import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncDecksForActivePair } from "@/lib/deckSyncer";

export async function GET() {
  try {
    const activePair = await prisma.languagePair.findFirst({
      where: { isActive: true },
    });
    if (!activePair) {
      return NextResponse.json([]);
    }

    // Sync decks first
    await syncDecksForActivePair();

    const decks = await prisma.deck.findMany({
      where: { languagePairId: activePair.id },
      include: {
        flashcards: true,
      },
    });

    const now = new Date();
    const result = decks.map(deck => {
      const totalCards = deck.flashcards.length;
      const dueCards = deck.flashcards.filter(c => new Date(c.nextReviewDate) <= now).length;
      return {
        id: deck.id,
        name: deck.name,
        totalCards,
        dueCards,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Review card
export async function PUT(req: Request) {
  try {
    const { cardId, rating } = await req.json(); // rating: 1=Again, 2=Hard, 3=Good, 4=Easy (SM-2 / FSRS)
    
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { deck: true },
    });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const now = new Date();
    let newInterval = card.interval || 1;
    let newRepetition = card.repetition || 0;
    let newEasiness = card.easinessFactor || 2.5;

    if (rating >= 3) {
      if (newRepetition === 0) {
        newInterval = 1; // 1 day
      } else if (newRepetition === 1) {
        newInterval = 6; // 6 days
      } else {
        newInterval = Math.round(newInterval * newEasiness);
      }
      newRepetition += 1;
    } else {
      newRepetition = 0;
      newInterval = 1;
    }

    newEasiness = newEasiness + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    newEasiness = Math.max(1.3, newEasiness);

    const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        interval: newInterval,
        repetition: newRepetition,
        easinessFactor: newEasiness,
        nextReviewDate,
        lastReviewDate: now,
      },
    });

    // If the card is bound to a word, we can also update the word's flip repetition state!
    if (card.wordId) {
      const isTN = card.deck.name.includes("➔"); // Target -> Native or vice versa
      const updateData: any = {};

      if (isTN) {
        updateData.flipTNWhenRepeat = nextReviewDate;
        updateData.flipTNDifficulty = newEasiness;
        updateData.flipTNRepetition = newRepetition;
      } else {
        updateData.flipNTWhenRepeat = nextReviewDate;
        updateData.flipNTDifficulty = newEasiness;
        updateData.flipNTRepetition = newRepetition;
      }

      await prisma.word.update({
        where: { id: card.wordId },
        data: updateData,
      });
    }

    return NextResponse.json(updatedCard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
