import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(messages: any[], jsonMode = false) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in environment variables.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API returned error: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function POST(req: Request) {
  try {
    const { action, text, sourceLanguage, targetLanguage, words, sentence } = await req.json();

    if (action === "translate") {
      const messages = [
        {
          role: "system",
          content: `You are an expert translator. Translate the text from ${sourceLanguage} to ${targetLanguage}. Provide 3 natural translation options separated by a pipe character (|). Only return the translation options, nothing else. No labels, no prefixes.`,
        },
        {
          role: "user",
          content: text,
        },
      ];

      const result = await callOpenAI(messages);
      const options = result.split("|").map((s: string) => s.trim());
      return NextResponse.json({ options });
    }

    if (action === "story") {
      const messages = [
        {
          role: "system",
          content: `You are an engaging story writer. Write a short, interesting story in ${targetLanguage} using the following vocabulary words: ${words.join(", ")}. The story should be easy to understand for language learners. Provide the story text and a translation in ${sourceLanguage} at the end, separated by a separator '---'.`,
        },
      ];

      const story = await callOpenAI(messages);
      const parts = story.split("---");
      return NextResponse.json({
        storyText: parts[0]?.trim() || "",
        translation: parts[1]?.trim() || "",
      });
    }

    if (action === "check") {
      const messages = [
        {
          role: "system",
          content: `You are a helpful language tutor. Check the sentence written in ${targetLanguage} by a student attempting to use the target word "${text}". 
Return a JSON object containing:
- "correctedSentence": the corrected version of the sentence.
- "score": a number from 0 to 10 evaluating grammar and naturalness.
- "explanation": a concise explanation of mistakes and feedback.
- "translation": translation of the corrected sentence into ${sourceLanguage}.`,
        },
        {
          role: "user",
          content: sentence,
        },
      ];

      const jsonStr = await callOpenAI(messages, true);
      const feedback = JSON.parse(jsonStr);
      return NextResponse.json(feedback);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
