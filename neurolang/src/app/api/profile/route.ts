import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let profile = await prisma.userProfile.findFirst();
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          name: "Student",
          totalXP: 0,
          streakCount: 0,
        },
      });
    }
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, totalXP, streakCount } = await req.json();
    let profile = await prisma.userProfile.findFirst();
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          name: name || "Student",
          totalXP: totalXP || 0,
          streakCount: streakCount || 0,
        },
      });
    } else {
      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          name: name !== undefined ? name : profile.name,
          totalXP: totalXP !== undefined ? totalXP : profile.totalXP,
          streakCount: streakCount !== undefined ? streakCount : profile.streakCount,
          lastPracticeDate: new Date(),
        },
      });
    }
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
