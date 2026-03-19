import { db } from "@/db";
import { claims, claimAuditTrail } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { NextRequest, NextResponse } from "next/server";
import { claimActionSchema } from "@/lib/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = claimActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, notes } = parsed.data;

  const [claim] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (claim.status !== "pending" && claim.status !== "in_review") {
    return NextResponse.json(
      { error: `Cannot ${action} a claim with status "${claim.status}"` },
      { status: 422 }
    );
  }

  const newStatus = action === "approve" ? "approved" : "denied";

  await db
    .update(claims)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(claims.id, id));

  await db.insert(claimAuditTrail).values({
    id: ulid(),
    claimId: id,
    action: newStatus,
    performedBy: "reviewer",
    previousStatus: claim.status,
    newStatus,
    notes: notes || `Claim ${newStatus}`,
    metadata: null,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, status: newStatus });
}
