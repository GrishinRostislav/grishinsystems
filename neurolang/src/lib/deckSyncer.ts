import { prisma } from "./db";

function languageFlag(lang: string): string {
  switch (lang.toLowerCase()) {
    case "russian": return "🇷🇺";
    case "english": return "🇬🇧";
    case "spanish": return "🇪🇸";
    case "french": return "🇫🇷";
    case "german": return "🇩🇪";
    default: return "🌐";
  }
}

export async function syncDecksForActivePair() {
  try {
    const activePair = await prisma.languagePair.findFirst({
      where: { isActive: true },
    });
    if (!activePair) return;

    const srcFlag = languageFlag(activePair.sourceLanguage);
    const tgtFlag = languageFlag(activePair.targetLanguage);

    // Get all words for active pair
    const words = await prisma.word.findMany({
      where: { languagePairId: activePair.id },
    });

    // Group words by category
    const categories = Array.from(new Set(words.map(w => w.category)));

    for (const catName of categories) {
      const catWords = words.filter(w => w.category === catName);

      // Deck 1: Target -> Native
      const deckTNName = `${catName} (${tgtFlag} ➔ ${srcFlag})`;
      let deckTN = await prisma.deck.findFirst({
        where: { name: deckTNName, languagePairId: activePair.id },
      });
      if (!deckTN) {
        deckTN = await prisma.deck.create({
          data: { name: deckTNName, languagePairId: activePair.id },
        });
      }

      // Deck 2: Native -> Target
      const deckNTName = `${catName} (${srcFlag} ➔ ${tgtFlag})`;
      let deckNT = await prisma.deck.findFirst({
        where: { name: deckNTName, languagePairId: activePair.id },
      });
      if (!deckNT) {
        deckNT = await prisma.deck.create({
          data: { name: deckNTName, languagePairId: activePair.id },
        });
      }

      // Sync cards for Deck TN and Deck NT
      for (const word of catWords) {
        // TN card
        const cardTN = await prisma.flashcard.findFirst({
          where: { deckId: deckTN.id, wordId: word.id },
        });
        if (!cardTN) {
          await prisma.flashcard.create({
            data: {
              deckId: deckTN.id,
              wordId: word.id,
              frontText: word.origin,
              backText: word.translate,
              nextReviewDate: word.flipTNWhenRepeat || new Date(),
              easinessFactor: 2.5,
              difficulty: word.flipTNDifficulty || 5.0,
            },
          });
        } else {
          await prisma.flashcard.update({
            where: { id: cardTN.id },
            data: {
              frontText: word.origin,
              backText: word.translate,
              nextReviewDate: word.flipTNWhenRepeat || undefined,
              difficulty: word.flipTNDifficulty || undefined,
            },
          });
        }

        // NT card
        const cardNT = await prisma.flashcard.findFirst({
          where: { deckId: deckNT.id, wordId: word.id },
        });
        if (!cardNT) {
          await prisma.flashcard.create({
            data: {
              deckId: deckNT.id,
              wordId: word.id,
              frontText: word.translate,
              backText: word.origin,
              nextReviewDate: word.flipNTWhenRepeat || new Date(),
              easinessFactor: 2.5,
              difficulty: word.flipNTDifficulty || 5.0,
            },
          });
        } else {
          await prisma.flashcard.update({
            where: { id: cardNT.id },
            data: {
              frontText: word.translate,
              backText: word.origin,
              nextReviewDate: word.flipNTWhenRepeat || undefined,
              difficulty: word.flipNTDifficulty || undefined,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Deck sync failed:", error);
  }
}
