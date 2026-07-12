import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureInitialized } from "@/lib/initializer";

export async function GET() {
  try {
    const { profile } = await ensureInitialized();
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, totalXP, streakCount } = await req.json();
    const { profile } = await ensureInitialized();

    const updated = await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        name: name !== undefined ? name : profile.name,
        totalXP: totalXP !== undefined ? totalXP : profile.totalXP,
        streakCount: streakCount !== undefined ? streakCount : profile.streakCount,
        lastPracticeDate: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
