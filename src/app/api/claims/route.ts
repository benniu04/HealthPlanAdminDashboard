import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { desc, eq, sql, and, gte, lte, like } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions = [];
  if (status) conditions.push(eq(claims.status, status));
  if (category) conditions.push(eq(claims.serviceCategory, category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      claimType: claims.claimType,
      status: claims.status,
      billedAmount: claims.billedAmount,
      allowedAmount: claims.allowedAmount,
      paidAmount: claims.paidAmount,
      memberResponsibility: claims.memberResponsibility,
      cptCode: claims.cptCode,
      icdCode: claims.icdCode,
      serviceCategory: claims.serviceCategory,
      description: claims.description,
      isAnomalous: claims.isAnomalous,
      anomalyReason: claims.anomalyReason,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeCode: employees.employeeCode,
      providerName: providers.name,
      providerType: providers.type,
    })
    .from(claims)
    .leftJoin(employees, eq(claims.employeeId, employees.id))
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .where(where)
    .orderBy(desc(claims.serviceDate))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(claims)
    .where(where);

  return NextResponse.json({ claims: results, total: count });
}
