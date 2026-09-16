import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "global" }
    }).catch(() => null);
    
    if (!settings) {
      settings = (await prisma.settings.findUnique({
        where: { id: "global" }
      }).catch(() => null)) as any;
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
    const { homeCurrency, appPassword, openaiApiKey, geminiApiKey, aiModel, aiCustomInstructions, aiFinancialGoal, aiAuditTone, aiMinBufferMonths } = body;

    const updateData: any = {};
    if (homeCurrency !== undefined) updateData.homeCurrency = homeCurrency;
    if (appPassword !== undefined) updateData.appPassword = appPassword && appPassword.trim() ? appPassword.trim() : null;
    if (openaiApiKey !== undefined) updateData.openaiApiKey = openaiApiKey && openaiApiKey.trim() ? openaiApiKey.trim() : null;
    if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey && geminiApiKey.trim() ? geminiApiKey.trim() : null;
    if (aiModel !== undefined) updateData.aiModel = aiModel && aiModel.trim() ? aiModel.trim() : "gpt-5.6-luna";
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
        openaiApiKey: openaiApiKey && openaiApiKey.trim() ? openaiApiKey.trim() : null,
        geminiApiKey: geminiApiKey && geminiApiKey.trim() ? geminiApiKey.trim() : null,
        aiModel: aiModel && aiModel.trim() ? aiModel.trim() : "gpt-5.6-luna",
        aiCustomInstructions: aiCustomInstructions || null,
        aiFinancialGoal: aiFinancialGoal || "balanced",
        aiAuditTone: aiAuditTone || "strict",
        aiMinBufferMonths: aiMinBufferMonths ? Number(aiMinBufferMonths) : 3,
      } as any
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
