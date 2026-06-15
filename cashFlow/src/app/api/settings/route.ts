import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "global" }
    });
    
    // Create defaults if not exists
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "global",
          homeCurrency: "CAD",
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { homeCurrency } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      update: { homeCurrency },
      create: {
        id: "global",
        homeCurrency: homeCurrency || "CAD"
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
