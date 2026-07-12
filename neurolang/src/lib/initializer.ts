import { prisma } from "./db";
import starterWords from "./starterWords.json";

export async function ensureInitialized() {
  try {
    // 1. Ensure UserProfile exists
    let profile = await prisma.userProfile.findFirst();
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          name: "Student",
          totalXP: 0,
          streakCount: 0,
          nativeLanguage: "English",
          targetLanguage: "Russian",
        },
      });
    }

    // 2. Ensure default active LanguagePair exists
    let activePair = await prisma.languagePair.findFirst({
      where: { userId: profile.id, isActive: true },
    });
    if (!activePair) {
      activePair = await prisma.languagePair.findFirst({
        where: { userId: profile.id },
      });
      if (!activePair) {
        activePair = await prisma.languagePair.create({
          data: {
            userId: profile.id,
            sourceLanguage: "English",
            targetLanguage: "Russian",
            proficiencyLevel: "A1",
            isActive: true,
          },
        });
      } else {
        activePair = await prisma.languagePair.update({
          where: { id: activePair.id },
          data: { isActive: true },
        });
      }
    }

    // 3. Ensure all default categories are created
    const defaultCategories = [
      { name: "General", sortOrder: -1 },
      { name: "Survival Words", sortOrder: 0 },
      { name: "Car & Road", sortOrder: 1 },
      { name: "Health & Pharmacy", sortOrder: 2 },
      { name: "Housing & Bills", sortOrder: 3 },
      { name: "Bank & Docs", sortOrder: 4 },
      { name: "Tools & Site", sortOrder: 5 },
      { name: "Small Talk", sortOrder: 6 },
      { name: "Soft Skills", sortOrder: 7 },
      { name: "Time and Weather", sortOrder: 8 },
      { name: "Abstract Concepts", sortOrder: 9 },
      { name: "Upper-Intermediate", sortOrder: 10 },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: { sortOrder: cat.sortOrder },
        create: { name: cat.name, sortOrder: cat.sortOrder },
      });
    }

    // 4. Ensure starter words are populated if the word table is empty
    const wordCount = await prisma.word.count({
      where: { languagePairId: activePair.id },
    });

    if (wordCount === 0) {
      console.log("Populating database with starter words...");
      
      const categoryMapping: Record<string, string> = {
        survivalWords: "Survival Words",
        carRoadWords: "Car & Road",
        healthPharmacyWords: "Health & Pharmacy",
        housingBillsWords: "Housing & Bills",
        bankDocsWords: "Bank & Docs",
        toolsSiteWords: "Tools & Site",
        smallTalkWords: "Small Talk",
        softSkillsWords: "Soft Skills",
        upperElementaryWords: "Upper-Intermediate",
        abstractConceptsWords: "Abstract Concepts",
      };

      const wordsToCreate = [];
      const now = new Date();

      for (const [key, categoryName] of Object.entries(categoryMapping)) {
        const list = (starterWords as any)[key] || [];
        for (const item of list) {
          wordsToCreate.push({
            languagePairId: activePair.id,
            origin: item.origin,
            translate: item.translate,
            category: categoryName,
            whenRepeat: now, // Due immediately
            isLearning: true,
          });
        }
      }

      // Bulk insert in chunks to prevent database payload errors
      const chunkSize = 100;
      for (let i = 0; i < wordsToCreate.length; i += chunkSize) {
        const chunk = wordsToCreate.slice(i, i + chunkSize);
        await prisma.word.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`Database populated with ${wordsToCreate.length} starter words.`);
    }

    return { profile, activePair };
  } catch (error) {
    console.error("Initialization failed:", error);
    throw error;
  }
}
