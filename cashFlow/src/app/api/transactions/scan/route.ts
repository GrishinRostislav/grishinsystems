import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // 1. Fetch categories
    let categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    // 2. Ensure a dedicated Taxes & Fees category exists
    let taxCat = categories.find(c => 
      c.name.toLowerCase().includes("tax") || 
      c.name.toLowerCase().includes("gst") || 
      c.name.toLowerCase().includes("fees")
    );
    
    if (!taxCat) {
      taxCat = await prisma.category.create({
        data: {
          name: "Taxes & Fees",
        }
      });
      // Refresh categories list
      categories = await prisma.category.findMany({
        select: { id: true, name: true }
      });
    }

    const categoriesList = categories.map(c => `"${c.name}" (ID: "${c.id}")`).join(', ');

    // Fallback: If GEMINI_API_KEY is not defined, return a mock parsed receipt for local testing
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Returning mock receipt data for testing.");
      const foodCat = categories.find(c => c.name.toLowerCase().includes("food") || c.name.toLowerCase().includes("groc") || c.name.toLowerCase().includes("eat"));

      return NextResponse.json({
        date: new Date().toISOString().slice(0, 10),
        merchant: "Costco Wholesale (Mock Demo)",
        items: [
          { code: "62773527971", rawName: "GV LG WHT 30", description: "GV LG WHT 30", amount: -6.49, categoryId: foodCat?.id || null },
          { code: "123456789", rawName: "Kirkland Bread 2pk", description: "Kirkland Bread 2pk", amount: -7.99, categoryId: foodCat?.id || null },
          { code: "987654321", rawName: "Kirkland Toilet Paper", description: "Kirkland Toilet Paper", amount: -21.99, categoryId: null }
        ],
        gst: { amount: -1.82, categoryId: taxCat?.id || null },
        _warning: "GEMINI_API_KEY environment variable is missing. Showing mock receipt scan data. Set up your key to use actual AI scanning."
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert file to base64 for Gemini multimodal API
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Initialize Gemini API Client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 3. Fetch recent product mappings to teach the AI
    const recentMappings = await prisma.productMapping.findMany({
      take: 100,
      orderBy: { updatedAt: "desc" },
    });
    const mappingExamples = recentMappings
      .filter(m => m.categoryId)
      .map(m => `"${m.rawName}" -> Category ID "${m.categoryId}"`)
      .join('\n      ');

    const prompt = `
      You are an expert financial scanner. Analyze this store receipt image carefully.
      
      Extract:
      1. Transaction Date: Format as YYYY-MM-DD. If the year is missing or not visible on the receipt, assume 2026.
      2. Merchant Name: The name of the store or merchant.
      3. List of items: For each line item purchased, extract:
         - "code": The barcode number, SKU, or product code printed next to the item description if visible (e.g. "62773527971"), otherwise null.
         - "rawName": The exact text description of the product as printed on the receipt (e.g. "GV LG WHT 30").
         - "amount": The final price of the item represented as a negative float (e.g. -5.42). Ignore intermediate discounts.
      4. GST (Tax): Goods and services tax amount (also known as VAT, НДС, Tax, etc), represented as a negative float (e.g., -0.28).
      
      Categorization:
      - Map each item to the most appropriate category ID from this list: [${categoriesList}].
      - STRICT RULE: For "categoryId", you MUST return the exact ID string (e.g., "cuid1234..."), NEVER the category name. If no category matches reasonably, use null.
      - For the GST/Tax/НДС item, assign it to the "Taxes & Fees" category ID: "${taxCat.id}".

      Here are some examples of how the user previously categorized items. Learn from these patterns for similar items:
      ${mappingExamples || "No previous examples."}

      Return the data strictly in the following JSON format. Ensure "rawName" is ALWAYS included and exactly matches the receipt text. Do not return any markdown code blocks, explanation or formatting:
      {
        "date": "YYYY-MM-DD",
        "merchant": "Merchant Name",
        "items": [
          { "code": "62773527971", "rawName": "GV LG WHT 30", "amount": -7.99, "categoryId": "category-id-or-null" }
        ],
        "gst": { "amount": -1.82, "categoryId": "category-id-for-tax" }
      }
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    const textResponse = result.response.text();
    
    // Clean code blocks (in case Gemini wraps JSON in markdown ```json ... ``` blocks)
    const cleanJsonText = textResponse
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const parsedData = JSON.parse(cleanJsonText);

    // Fix hallucinated category IDs (if Gemini returned a name instead of an ID)
    if (parsedData.items) {
      for (const item of parsedData.items) {
        if (item.categoryId && !categories.find(c => c.id === item.categoryId)) {
          const match = categories.find(c => c.name.toLowerCase() === String(item.categoryId).toLowerCase());
          if (match) {
            item.categoryId = match.id;
          } else {
            item.categoryId = null;
          }
        }
      }
    }

    // 3. Apply stored Product Mappings (Product translation dictionary)
    const mappings = await prisma.productMapping.findMany();
    const processedItems = [];

    for (const item of parsedData.items) {
      let mapping = null;
      
      // Look up by product code first
      if (item.code) {
        mapping = mappings.find(m => m.code === item.code);
      }
      
      // Look up by raw receipt name if no code mapping was found
      if (!mapping && item.rawName) {
        mapping = mappings.find(m => m.rawName === item.rawName);
      }

      if (mapping) {
        processedItems.push({
          code: item.code || mapping.code || null,
          rawName: item.rawName,
          description: mapping.friendlyName, // Use the user-defined name!
          amount: item.amount,
          categoryId: mapping.categoryId || item.categoryId // Use the user-defined category!
        });
      } else {
        processedItems.push({
          code: item.code || null,
          rawName: item.rawName,
          description: item.rawName, // Default to raw receipt name
          amount: item.amount,
          categoryId: item.categoryId
        });
      }
    }

    parsedData.items = processedItems;

    // Force GST to Taxes & Fees category
    if (parsedData.gst) {
      parsedData.gst.categoryId = taxCat.id;
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: `Failed to analyze receipt: ${error.message || error}` },
      { status: 500 }
    );
  }
}
