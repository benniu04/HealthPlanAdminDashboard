import { NextRequest } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { eobSummarySchema } from "@/lib/schemas";
import { eobResponseSchema } from "@/lib/ai/schemas";
import {
  EOB_SYSTEM_PROMPT,
  buildEobUserPrompt,
  buildEobFallbackSummary,
} from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = eobSummarySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: EOB_SYSTEM_PROMPT,
        prompt: buildEobUserPrompt(data),
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const eobParsed = eobResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
        if (eobParsed.success) {
          return Response.json(eobParsed.data);
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  return Response.json(buildEobFallbackSummary(data));
}
