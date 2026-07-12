import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureInitialized } from "@/lib/initializer";

export async function GET() {
  try {
    const { profile } = await ensureInitialized();
    const pairs = await prisma.languagePair.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pairs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { sourceLanguage, targetLanguage, proficiencyLevel, isActive } = await req.json();
    const { profile } = await ensureInitialized();

    if (isActive) {
      // Deactivate all other pairs
      await prisma.languagePair.updateMany({
        where: { userId: profile.id },
        data: { isActive: false },
      });
    }

    const newPair = await prisma.languagePair.create({
      data: {
        userId: profile.id,
        sourceLanguage,
        targetLanguage,
        proficiencyLevel: proficiencyLevel || "A1",
        isActive: isActive || false,
      },
    });

    return NextResponse.json(newPair);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, isActive, proficiencyLevel } = await req.json();
    const { profile } = await ensureInitialized();

    if (isActive) {
      await prisma.languagePair.updateMany({
        where: { userId: profile.id },
        data: { isActive: false },
      });
    }

    const updated = await prisma.languagePair.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        proficiencyLevel: proficiencyLevel || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
