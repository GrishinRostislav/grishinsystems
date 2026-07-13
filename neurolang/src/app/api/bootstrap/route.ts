import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureInitialized } from "@/lib/initializer";

export async function GET() {
  try {
    const { profile, activePair } = await ensureInitialized();

    const [languages, words, categories, quests, stats, decks] = await Promise.all([
      prisma.languagePair.findMany({
        where: { userId: profile.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.word.findMany({
        where: { languagePairId: activePair.id },
        orderBy: { whenAdded: "desc" },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
      }),
      prisma.quest.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.dailyStat.findMany({
        orderBy: { date: "asc" },
      }),
      prisma.deck.findMany({
        where: { languagePairId: activePair.id },
        include: { flashcards: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      profile,
      languages,
      words,
      categories,
      quests,
      stats,
      decks,
    });
  } catch (error: any) {
    console.error("Bootstrap error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
