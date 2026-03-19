import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { eobSummarySchema } from "@/lib/schemas";
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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = eobSummarySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = parsed.data;

  if (process.env.ANTHROPIC_API_KEY) {
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: EOB_SYSTEM_PROMPT,
      prompt: buildEobUserPrompt(data),
    });

    return result.toTextStreamResponse();
  }

  return new Response(buildEobFallbackSummary(data), {
    headers: { "Content-Type": "text/plain" },
  });
}
