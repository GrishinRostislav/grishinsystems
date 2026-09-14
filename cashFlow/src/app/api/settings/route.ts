import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "global" }
    }).catch(() => null);
    
    if (!settings) {
      settings = await prisma.settings.findUnique({
        where: { id: "global" },
        select: { id: true, homeCurrency: true }
      }).catch(() => null);
    }

    if (!settings) {
      settings = {
        id: "global",
        homeCurrency: "CAD",
        appPassword: null,
        aiCustomInstructions: null,
        aiFinancialGoal: "balanced",
        aiAuditTone: "strict",
        aiMinBufferMonths: 3,
        updatedAt: new Date()
      } as any;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ homeCurrency: "CAD" });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { homeCurrency, appPassword, geminiApiKey, aiCustomInstructions, aiFinancialGoal, aiAuditTone, aiMinBufferMonths } = body;

    const updateData: any = {};
    if (homeCurrency !== undefined) updateData.homeCurrency = homeCurrency;
    if (appPassword !== undefined) updateData.appPassword = appPassword && appPassword.trim() ? appPassword.trim() : null;
    if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey && geminiApiKey.trim() ? geminiApiKey.trim() : null;
    if (aiCustomInstructions !== undefined) updateData.aiCustomInstructions = aiCustomInstructions;
    if (aiFinancialGoal !== undefined) updateData.aiFinancialGoal = aiFinancialGoal;
    if (aiAuditTone !== undefined) updateData.aiAuditTone = aiAuditTone;
    if (aiMinBufferMonths !== undefined) updateData.aiMinBufferMonths = Number(aiMinBufferMonths);

    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        homeCurrency: homeCurrency || "CAD",
        appPassword: appPassword && appPassword.trim() ? appPassword.trim() : null,
        geminiApiKey: geminiApiKey && geminiApiKey.trim() ? geminiApiKey.trim() : null,
        aiCustomInstructions: aiCustomInstructions || null,
        aiFinancialGoal: aiFinancialGoal || "balanced",
        aiAuditTone: aiAuditTone || "strict",
        aiMinBufferMonths: aiMinBufferMonths ? Number(aiMinBufferMonths) : 3,
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
