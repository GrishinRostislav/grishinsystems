import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today.getTime() + 86400000);

    // Fetch quests for today
    let quests = await prisma.quest.findMany({
      where: {
        questDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (quests.length === 0) {
      // Generate daily quests on the fly!
      // Quest 1: Review words (count of words currently due)
      const dueCount = await prisma.word.count({
        where: {
          OR: [
            { whenRepeat: { lte: new Date() } },
            { whenRepeat: null },
          ],
        },
      });

      const reviewQuest = {
        questTypeKey: "reviewAllWords",
        title: "Daily Review",
        description: `Review ${Math.max(5, dueCount)} words due today`,
        icon: "📋",
        xpReward: 150,
        targetAmount: Math.max(5, dueCount),
        currentAmount: 0,
        questDate: today,
      };

      // Quest 2: Study 10 words
      const studyQuest10 = {
        questTypeKey: "learnNewWords",
        title: "Vocabulary Builder",
        description: "Practice 10 vocabulary words",
        icon: "🧠",
        xpReward: 100,
        targetAmount: 10,
        currentAmount: 0,
        questDate: today,
      };

      // Quest 3: Earn 100 XP
      const xpQuest = {
        questTypeKey: "earnXP",
        title: "XP Booster",
        description: "Earn 100 XP from lessons",
        icon: "⚡",
        xpReward: 200,
        targetAmount: 100,
        currentAmount: 0,
        questDate: today,
      };

      // Quest 4: Complete a story review
      const storyQuest = {
        questTypeKey: "readStory",
        title: "Reading practice",
        description: "Create and read a vocabulary story",
        icon: "📖",
        xpReward: 150,
        targetAmount: 1,
        currentAmount: 0,
        questDate: today,
      };

      await prisma.quest.createMany({
        data: [reviewQuest, studyQuest10, xpQuest, storyQuest],
      });

      quests = await prisma.quest.findMany({
        where: {
          questDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
    }

    return NextResponse.json(quests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Claim / Update progress
export async function PUT(req: Request) {
  try {
    const { questId, claim, progressAmount } = await req.json();

    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (claim) {
      // Claim reward XP
      const updated = await prisma.quest.update({
        where: { id: questId },
        data: { isClaimed: true },
      });
      return NextResponse.json(updated);
    }

    if (progressAmount !== undefined) {
      const newAmount = Math.min(quest.targetAmount, quest.currentAmount + progressAmount);
      const updated = await prisma.quest.update({
        where: { id: questId },
        data: { currentAmount: newAmount },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No action provided" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
