import { NextRequest } from "next/server";
import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { formatCents, CLAIM_STATUSES, SERVICE_CATEGORIES } from "@/lib/constants";

function statusLabel(value: string): string {
  return CLAIM_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function categoryLabel(value: string | null): string {
  if (!value) return "";
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  "Claim #",
  "Employee",
  "Employee Code",
  "Provider",
  "Description",
  "Category",
  "Claim Type",
  "Service Date",
  "Billed",
  "Allowed",
  "Paid",
  "Member Responsibility",
  "Status",
  "Anomalous",
  "Anomaly Reason",
] as const;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const conditions = [];
  if (status) conditions.push(eq(claims.status, status));
  if (category) conditions.push(eq(claims.serviceCategory, category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      claimType: claims.claimType,
      status: claims.status,
      billedAmount: claims.billedAmount,
      allowedAmount: claims.allowedAmount,
      paidAmount: claims.paidAmount,
      memberResponsibility: claims.memberResponsibility,
      serviceCategory: claims.serviceCategory,
      description: claims.description,
      isAnomalous: claims.isAnomalous,
      anomalyReason: claims.anomalyReason,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeCode: employees.employeeCode,
      providerName: providers.name,
    })
    .from(claims)
    .leftJoin(employees, eq(claims.employeeId, employees.id))
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .where(where)
    .orderBy(desc(claims.serviceDate));

  const rows = results.map((r) =>
    [
      r.claimNumber,
      `${r.employeeFirstName ?? ""} ${r.employeeLastName ?? ""}`.trim(),
      r.employeeCode ?? "",
      r.providerName ?? "",
      r.description ?? "",
      categoryLabel(r.serviceCategory),
      r.claimType,
      r.serviceDate,
      formatCents(r.billedAmount),
      formatCents(r.allowedAmount),
      formatCents(r.paidAmount),
      formatCents(r.memberResponsibility),
      statusLabel(r.status),
      r.isAnomalous ? "Yes" : "No",
      r.anomalyReason ?? "",
    ]
      .map(escapeCsvField)
      .join(",")
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="claims-export.csv"',
    },
  });
}
