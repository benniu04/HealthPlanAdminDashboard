import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/db";
import { claims, employees, providers, plans, claimAuditTrail } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { CLAIM_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { buildClaimContext } from "@/lib/ai/context-builders";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const uiMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  parts: z.array(textPartSchema),
});

const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema),
  claimId: z.string().min(1),
});

function uiMessagesToModelMessages(
  messages: ReadonlyArray<z.infer<typeof uiMessageSchema>>
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join(""),
  }));
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, claimId } = parsed.data;

  const [claim] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
  if (!claim) {
    return new Response(JSON.stringify({ error: "Claim not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [employee] = await db.select().from(employees).where(eq(employees.id, claim.employeeId)).limit(1);
  const [provider] = await db.select().from(providers).where(eq(providers.id, claim.providerId)).limit(1);
  const [plan] = await db.select().from(plans).where(eq(plans.id, claim.planId)).limit(1);
  const auditTrail = await db
    .select()
    .from(claimAuditTrail)
    .where(eq(claimAuditTrail.claimId, claimId))
    .orderBy(asc(claimAuditTrail.createdAt));

  const claimContext = buildClaimContext({ claim, employee, provider, plan, auditTrail });

  const systemPrompt = `${CLAIM_CHAT_SYSTEM_PROMPT}

--- CLAIM DATA ---
${claimContext}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "I can see this is claim " + claim.claimNumber + " for " + employee.firstName + " " + employee.lastName +
      ". The billed amount is $" + (claim.billedAmount / 100).toFixed(2) + " and the plan paid $" +
      (claim.paidAmount / 100).toFixed(2) + ". To get AI-powered analysis, please configure your ANTHROPIC_API_KEY.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  const modelMessages = uiMessagesToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toTextStreamResponse();
}
