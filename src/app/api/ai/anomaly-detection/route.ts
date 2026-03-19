import { NextRequest } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { db } from "@/db";
import { claims, employees, providers, claimAuditTrail } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { anomalyDetectionRequestSchema, anomalyResultSchema } from "@/lib/ai/schemas";
import { buildAnomalyDetectionPrompt } from "@/lib/ai/prompts";

const BATCH_SIZE = 20;

type ClaimRow = {
  readonly id: string;
  readonly claimNumber: string;
  readonly cptCode: string | null;
  readonly billedAmount: number;
  readonly allowedAmount: number;
  readonly paidAmount: number;
  readonly serviceDate: string;
  readonly description: string | null;
  readonly serviceCategory: string | null;
  readonly employeeFirstName: string | null;
  readonly employeeLastName: string | null;
  readonly providerName: string | null;
};

function toPromptClaim(row: ClaimRow) {
  return {
    claimId: row.id,
    claimNumber: row.claimNumber,
    cptCode: row.cptCode,
    billedAmount: row.billedAmount,
    allowedAmount: row.allowedAmount,
    paidAmount: row.paidAmount,
    serviceDate: row.serviceDate,
    providerName: row.providerName ?? "Unknown",
    employeeName: `${row.employeeFirstName ?? ""} ${row.employeeLastName ?? ""}`.trim() || "Unknown",
    description: row.description,
    serviceCategory: row.serviceCategory,
  };
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = anomalyDetectionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { claimIds } = parsed.data;

  const claimRows: ClaimRow[] = claimIds
    ? await db
        .select({
          id: claims.id,
          claimNumber: claims.claimNumber,
          cptCode: claims.cptCode,
          billedAmount: claims.billedAmount,
          allowedAmount: claims.allowedAmount,
          paidAmount: claims.paidAmount,
          serviceDate: claims.serviceDate,
          description: claims.description,
          serviceCategory: claims.serviceCategory,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          providerName: providers.name,
        })
        .from(claims)
        .leftJoin(employees, eq(claims.employeeId, employees.id))
        .leftJoin(providers, eq(claims.providerId, providers.id))
        .where(inArray(claims.id, claimIds))
    : await db
        .select({
          id: claims.id,
          claimNumber: claims.claimNumber,
          cptCode: claims.cptCode,
          billedAmount: claims.billedAmount,
          allowedAmount: claims.allowedAmount,
          paidAmount: claims.paidAmount,
          serviceDate: claims.serviceDate,
          description: claims.description,
          serviceCategory: claims.serviceCategory,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          providerName: providers.name,
        })
        .from(claims)
        .leftJoin(employees, eq(claims.employeeId, employees.id))
        .leftJoin(providers, eq(claims.providerId, providers.id))
        .where(eq(claims.isAnomalous, false))
        .orderBy(desc(claims.createdAt))
        .limit(100);

  if (claimRows.length === 0) {
    return Response.json({ analyzed: 0, flagged: 0, results: [] });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      error: "ANTHROPIC_API_KEY is required for anomaly detection",
    }, { status: 503 });
  }

  const allResults: Array<{ claimId: string; isAnomalous: boolean; anomalyReason: string | null; confidence: number }> = [];

  for (let i = 0; i < claimRows.length; i += BATCH_SIZE) {
    const batch = claimRows.slice(i, i + BATCH_SIZE);
    const prompt = buildAnomalyDetectionPrompt(batch.map(toPromptClaim));

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) continue;

    const batchParsed = anomalyResultSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!batchParsed.success) continue;

    allResults.push(...batchParsed.data);
  }

  let flagged = 0;
  const now = new Date();

  for (const result of allResults) {
    if (result.isAnomalous) {
      flagged++;
      await db
        .update(claims)
        .set({
          isAnomalous: true,
          anomalyReason: result.anomalyReason,
          updatedAt: now,
        })
        .where(eq(claims.id, result.claimId));

      await db.insert(claimAuditTrail).values({
        id: ulid(),
        claimId: result.claimId,
        action: "flagged_anomaly",
        performedBy: "ai",
        notes: result.anomalyReason ?? "Flagged by AI anomaly detection",
        createdAt: now,
      });
    }
  }

  return Response.json({
    analyzed: claimRows.length,
    flagged,
    results: allResults.filter((r) => r.isAnomalous),
  });
}
