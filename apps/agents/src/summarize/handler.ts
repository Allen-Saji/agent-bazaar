import type { Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeHandler(req: Request, res: Response): Promise<void> {
  const { text, max_words = 200 } = req.body;

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
        content: `You are a concise summarizer. Summarize the given text in ${max_words} words or fewer. Return only the summary, no preamble.`,
      },
      { role: "user", content: text },
    ],
    max_tokens: Math.ceil(max_words * 2),
    temperature: 0.3,
  });

  const summary = completion.choices[0]?.message?.content?.trim() || "";

  res.json({ summary });
}
