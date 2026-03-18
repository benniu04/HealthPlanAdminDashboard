import { db } from "@/db";
import { claims, claimAuditTrail } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body as { action: "approve" | "deny"; notes?: string };

  const [claim] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
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
