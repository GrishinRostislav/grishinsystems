import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Helper to convert Cocoa timestamp (seconds since Jan 1, 2001) to JS Date
function cocoaToDate(timestamp: number | null | undefined): Date | null {
  if (!timestamp || isNaN(timestamp)) return null;
  // Cocoa epoch starts on Jan 1, 2001. Unix epoch starts on Jan 1, 1970.
  // The difference is 978307200 seconds.
  return new Date((timestamp + 978307200) * 1000);
}

export async function POST(req: Request) {
  const tempPath = path.join("/tmp", `default_store_${Date.now()}.db`);
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    // 1. Check if the database contains the required tables
    let tablesList = "";
    try {
      const { stdout } = await execAsync(`sqlite3 "${tempPath}" ".tables"`);
      tablesList = stdout;
    } catch (err: any) {
      return NextResponse.json({ error: `Invalid database file: ${err.message}` }, { status: 400 });
    }

    if (!tablesList.includes("ZWORD") && !tablesList.includes("ZUSERPROFILE")) {
      return NextResponse.json({
        error: "Database does not contain SwiftData tables (ZWORD, ZUSERPROFILE). Make sure this is the default.store file.",
      }, { status: 400 });
    }

    console.log("Parsing UserProfile...");
    let importedXP = 0;
    let importedStreak = 0;
    let importedName = "Student";
    try {
      const { stdout } = await execAsync(`sqlite3 -json "${tempPath}" "SELECT ZNAME, ZTOTALXP, ZSTREAKCOUNT FROM ZUSERPROFILE LIMIT 1;"`);
      if (stdout.trim()) {
        const rows = JSON.parse(stdout);
        if (rows && rows.length > 0) {
          importedName = rows[0].ZNAME || "Student";
          importedXP = parseInt(rows[0].ZTOTALXP) || 0;
          importedStreak = parseInt(rows[0].ZSTREAKCOUNT) || 0;
        }
      }
    } catch (err) {
      console.warn("Failed to extract UserProfile details, using defaults", err);
    }

    console.log("Parsing LanguagePairs...");
    const pairsMap: Record<number, string> = {}; // maps SwiftData Z_PK to our DB UUID
    try {
      const { stdout } = await execAsync(`sqlite3 -json "${tempPath}" "SELECT Z_PK, ZSOURCELANGUAGE, ZTARGETLANGUAGE, ZPROFICIENCYLEVEL, ZISACTIVE FROM ZLANGUAGEPAIR;"`);
      if (stdout.trim()) {
        const rows = JSON.parse(stdout);
        
        // Find/Create profile
        let profile = await prisma.userProfile.findFirst();
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
              totalXP: Math.max(profile.totalXP, importedXP),
              streakCount: Math.max(profile.streakCount, importedStreak),
            }
          });
        }

        for (const row of rows) {
          const lp = await prisma.languagePair.create({
            data: {
              userId: profile.id,
              sourceLanguage: row.ZSOURCELANGUAGE || "English",
              targetLanguage: row.ZTARGETLANGUAGE || "Russian",
              proficiencyLevel: row.ZPROFICIENCYLEVEL || "A1",
              isActive: row.ZISACTIVE === 1,
            }
          });
          pairsMap[row.Z_PK] = lp.id;
        }
      }
    } catch (err) {
      console.error("Failed to parse language pairs", err);
    }

    console.log("Parsing Words...");
    let wordsCount = 0;
    try {
      const { stdout } = await execAsync(`sqlite3 -json "${tempPath}" "SELECT ZORIGIN, ZTRANSLATE, ZCATEGORY, ZWORDPOINTS, ZWHENREPEAT, ZWRONGANSWER, ZRIGHTANSWER, ZISLEARNING, ZLANGUAGEPAIR, ZFSRSSTABILITY, ZFSRSDIFFICULTY, ZFSRSLASTREVIEW FROM ZWORD;"`);
      if (stdout.trim()) {
        const rows = JSON.parse(stdout);

        const wordsToCreate = [];
        for (const row of rows) {
          const targetPairId = pairsMap[row.ZLANGUAGEPAIR];
          if (!targetPairId) continue; // skip if no matching language pair

          wordsToCreate.push({
            languagePairId: targetPairId,
            origin: row.ZORIGIN || "",
            translate: row.ZTRANSLATE || "",
            category: row.ZCATEGORY || "General",
            wordPoints: parseFloat(row.ZWORDPOINTS) || 0.0,
            whenRepeat: cocoaToDate(row.ZWHENREPEAT),
            wrongAnswer: parseInt(row.ZWRONGANSWER) || 0,
            rightAnswer: parseInt(row.ZRIGHTANSWER) || 0,
            isLearning: row.ZISLEARNING === 1,
            fsrsStability: parseFloat(row.ZFSRSSTABILITY) || null,
            fsrsDifficulty: parseFloat(row.ZFSRSDIFFICULTY) || null,
            fsrsLastReview: cocoaToDate(row.ZFSRSLASTREVIEW),
          });
        }

        if (wordsToCreate.length > 0) {
          // Bulk insert
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
      }
    } catch (err) {
      console.error("Failed to parse words", err);
    }

    return NextResponse.json({
      success: true,
      message: `Database imported successfully! Imported ${wordsCount} words.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}
