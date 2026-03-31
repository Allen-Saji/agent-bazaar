import type { Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function sentimentHandler(req: Request, res: Response): Promise<void> {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing required field: text" });
    return;
  }

  if (text.length > 50000) {
    res.status(400).json({ error: "Text exceeds maximum length of 50000 characters" });
    return;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze the sentiment of the given text. Respond with valid JSON only:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": <number between -1.0 and 1.0>,
  "reasoning": "<brief explanation>"
}`,
      },
      { role: "user", content: text },
    ],
    max_tokens: 200,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";

  const parsed = JSON.parse(raw) as {
    sentiment: string;
    score: number;
    reasoning: string;
  };

  res.json({
    sentiment: parsed.sentiment || "neutral",
    score: typeof parsed.score === "number" ? parsed.score : 0,
    reasoning: parsed.reasoning || "",
  });
}
