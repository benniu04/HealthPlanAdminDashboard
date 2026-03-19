import { NextRequest } from "next/server";
import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { or, like, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return Response.json({ claims: [], employees: [], providers: [] });
  }

  const pattern = `%${q}%`;

  const [matchedClaims, matchedEmployees, matchedProviders] = await Promise.all([
    db
      .select({
        id: claims.id,
        claimNumber: claims.claimNumber,
        description: claims.description,
        status: claims.status,
      })
      .from(claims)
      .where(
        or(
          like(claims.claimNumber, pattern),
          like(claims.description, pattern)
        )
      )
      .limit(5),

    db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(employees)
      .where(
        or(
          like(employees.firstName, pattern),
          like(employees.lastName, pattern),
          like(employees.email, pattern),
          like(employees.employeeCode, pattern),
          like(sql`${employees.firstName} || ' ' || ${employees.lastName}`, pattern)
        )
      )
      .limit(5),

    db
      .select({
        id: providers.id,
        name: providers.name,
        specialty: providers.specialty,
        networkStatus: providers.networkStatus,
      })
      .from(providers)
      .where(
        or(
          like(providers.name, pattern),
          like(providers.specialty, pattern),
          like(providers.npi, pattern)
        )
      )
      .limit(5),
  ]);

  return Response.json({
    claims: matchedClaims,
    employees: matchedEmployees,
    providers: matchedProviders,
  });
}
