import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week"; // week, month, year

    const now = new Date();
    let startDate = new Date();

    if (range === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "month") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "year") {
      startDate.setDate(now.getDate() - 365);
    }

    startDate.setHours(0, 0, 0, 0);

    const stats = await prisma.dailyStat.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Log daily activity
export async function POST(req: Request) {
  try {
    const { xpEarned, wordsMastered, wordsReviewed, wordsLearned } = await req.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stat = await prisma.dailyStat.upsert({
      where: { date: today },
      update: {
        xpEarned: { increment: xpEarned || 0 },
        wordsMastered: { increment: wordsMastered || 0 },
        wordsReviewed: { increment: wordsReviewed || 0 },
        wordsLearned: { increment: wordsLearned || 0 },
      },
      create: {
        date: today,
        xpEarned: xpEarned || 0,
        wordsMastered: wordsMastered || 0,
        wordsReviewed: wordsReviewed || 0,
        wordsLearned: wordsLearned || 0,
      },
    });

    return NextResponse.json(stat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
