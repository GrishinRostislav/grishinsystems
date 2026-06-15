const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoriesList = categories.map(c => `"${c.name}" (ID: "${c.id}")`).join(', ');
  console.log("=== CATEGORIES LIST ===");
  console.log(categoriesList);
  
  const taxCat = categories.find(c => 
    c.name.toLowerCase().includes("tax") || 
    c.name.toLowerCase().includes("gst") || 
    c.name.toLowerCase().includes("fees")
  );
  console.log("=== TAX CAT ===");
  console.log(taxCat);

  console.log("=== PRODUCT MAPPINGS ===");
  console.log(await prisma.productMapping.findMany());
}
main().finally(() => prisma.$disconnect());
