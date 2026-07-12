import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const dueOnly = searchParams.get("due") === "true";

    const whereClause: any = {
      deckId: id,
    };

    if (dueOnly) {
      whereClause.nextReviewDate = {
        lte: new Date(),
      };
    }

    const cards = await prisma.flashcard.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
