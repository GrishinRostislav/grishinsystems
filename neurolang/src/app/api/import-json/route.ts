import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function cocoaToDate(timestamp: number | null | undefined): Date | null {
  if (!timestamp || isNaN(timestamp)) return null;
  return new Date((timestamp + 978307200) * 1000);
}

export async function POST(req: Request) {
  try {
    const { profile: importedProfile, languagePairs, words } = await req.json();

    if (!languagePairs || !words) {
      return NextResponse.json({ error: "Missing required import data fields" }, { status: 400 });
    }

    console.log("Saving UserProfile...");
    let profile = await prisma.userProfile.findFirst();
    const importedName = importedProfile?.name || "Student";
    const importedXP = parseInt(importedProfile?.totalXP) || 0;
    const importedStreak = parseInt(importedProfile?.streakCount) || 0;

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          name: importedName,
          totalXP: importedXP,
          streakCount: importedStreak,
        }
      });
    } else {
      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          name: importedName,
          totalXP: Math.max(profile.totalXP, importedXP),
          streakCount: Math.max(profile.streakCount, importedStreak),
        }
      });
    }

    console.log("Saving LanguagePairs...");
    const pairsMap: Record<number, string> = {};

    for (const pair of languagePairs) {
      let lp = await prisma.languagePair.findFirst({
        where: {
          userId: profile.id,
          sourceLanguage: pair.sourceLanguage || "English",
          targetLanguage: pair.targetLanguage || "Russian",
        }
      });

      if (!lp) {
        lp = await prisma.languagePair.create({
          data: {
            userId: profile.id,
            sourceLanguage: pair.sourceLanguage || "English",
            targetLanguage: pair.targetLanguage || "Russian",
            proficiencyLevel: pair.proficiencyLevel || "A1",
            isActive: pair.isActive === 1 || pair.isActive === true,
          }
        });
      }
      pairsMap[pair.pk] = lp.id;
    }

    console.log("Saving Words...");
    const wordsToCreate = [];
    for (const row of words) {
      const targetPairId = pairsMap[row.languagePairPk];
      if (!targetPairId) continue;

      wordsToCreate.push({
        languagePairId: targetPairId,
        origin: row.origin || "",
        translate: row.translate || "",
        category: row.category || "General",
        wordPoints: parseFloat(row.wordPoints) || 0.0,
        whenRepeat: cocoaToDate(row.whenRepeat),
        wrongAnswer: parseInt(row.wrongAnswer) || 0,
        rightAnswer: parseInt(row.rightAnswer) || 0,
        isLearning: row.isLearning === 1 || row.isLearning === true,
        fsrsStability: parseFloat(row.fsrsStability) || null,
        fsrsDifficulty: parseFloat(row.fsrsDifficulty) || null,
        fsrsLastReview: cocoaToDate(row.fsrsLastReview),
      });
    }

    let wordsCount = 0;
    if (wordsToCreate.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < wordsToCreate.length; i += chunkSize) {
        const chunk = wordsToCreate.slice(i, i + chunkSize);
        await prisma.word.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      wordsCount = wordsToCreate.length;
    }

    return NextResponse.json({
      success: true,
      message: `Database imported successfully! Imported ${wordsCount} words.`,
    });
  } catch (error: any) {
    console.error("Import JSON error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
