import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // Fetch existing categories from Postgres database to pass to Gemini for smart classification
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoriesList = categories.map(c => `"${c.name}" (ID: "${c.id}")`).join(', ');

    // Fallback: If GEMINI_API_KEY is not defined, return a mock parsed receipt for local testing and demonstration
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Returning mock receipt data for testing.");
      const foodCat = categories.find(c => c.name.toLowerCase().includes("food") || c.name.toLowerCase().includes("groc") || c.name.toLowerCase().includes("eat"));
      const taxCat = categories.find(c => c.name.toLowerCase().includes("tax") || c.name.toLowerCase().includes("fee") || c.name.toLowerCase().includes("util"));

      return NextResponse.json({
        date: new Date().toISOString().slice(0, 10),
        merchant: "Costco Wholesale (Mock Demo)",
        items: [
          { description: "Organic Milk 3.25% 4L", amount: -6.49, categoryId: foodCat?.id || null },
          { description: "Whole Wheat Bread 2-Pack", amount: -7.99, categoryId: foodCat?.id || null },
          { description: "Kirkland Bath Tissue 30-Roll", amount: -21.99, categoryId: null }
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

    const prompt = `
      You are an expert financial scanner. Analyze this store receipt image carefully.
      
      Extract:
      1. Transaction Date: Format as YYYY-MM-DD. If the year is missing or not visible on the receipt, assume 2026.
      2. Merchant Name: The name of the store or merchant.
      3. List of items: For each line item purchased, extract the description (as item name) and its final price. The amount MUST be represented as a negative float (e.g. -5.42) since it is an expense. Ignore intermediate prices/discounts, only extract final items cost.
      4. GST (Tax): Goods and services tax amount, represented as a negative float (e.g., -0.28).
      
      Categorization:
      - Map each item to the most appropriate category ID from this list: [${categoriesList}].
      - If no category matches reasonably, use null for categoryId.
      - For the GST/Tax item, assign it to a category that represents "Tax", "Fees", or "Utilities" if it exists in the list above, or use null for categoryId.

      Return the data strictly in the following JSON format. Do not return any markdown code blocks, explanation or formatting:
      {
        "date": "YYYY-MM-DD",
        "merchant": "Merchant Name",
        "items": [
          { "description": "Item Name", "amount": -1.23, "categoryId": "category-id-or-null" }
        ],
        "gst": { "amount": -0.28, "categoryId": "category-id-for-tax-or-null" }
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
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: `Failed to analyze receipt: ${error.message || error}` },
      { status: 500 }
    );
  }
}
