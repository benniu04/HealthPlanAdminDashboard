import { db } from "@/db";
import { claims } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  // Monthly spending by claim type
  const monthlySpending = await db
    .select({
      month: sql<string>`substr(${claims.serviceDate}, 1, 7)`,
      medical: sql<number>`sum(case when ${claims.claimType} = 'medical' then ${claims.paidAmount} else 0 end)`,
      pharmacy: sql<number>`sum(case when ${claims.claimType} = 'pharmacy' then ${claims.paidAmount} else 0 end)`,
      behavioral: sql<number>`sum(case when ${claims.claimType} = 'behavioral' then ${claims.paidAmount} else 0 end)`,
      total: sql<number>`sum(${claims.paidAmount})`,
    })
    .from(claims)
    .groupBy(sql`substr(${claims.serviceDate}, 1, 7)`)
    .orderBy(sql`substr(${claims.serviceDate}, 1, 7)`);

  // Spending by category
  const byCategory = await db
    .select({
      category: claims.serviceCategory,
      total: sql<number>`sum(${claims.paidAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(claims)
    .groupBy(claims.serviceCategory)
    .orderBy(sql`sum(${claims.paidAmount}) desc`);

  // KPI stats
  const [stats] = await db
    .select({
      totalClaims: sql<number>`count(*)`,
      totalSpend: sql<number>`sum(${claims.paidAmount})`,
      avgClaimCost: sql<number>`avg(${claims.paidAmount})`,
      anomalyCount: sql<number>`sum(case when ${claims.isAnomalous} = 1 then 1 else 0 end)`,
      pendingCount: sql<number>`sum(case when ${claims.status} = 'pending' or ${claims.status} = 'in_review' then 1 else 0 end)`,
    })
    .from(claims);

  // Format monthly data for chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = monthlySpending.map((row) => {
    const monthNum = parseInt(row.month.split("-")[1]) - 1;
    return {
      month: monthNames[monthNum],
      medical: row.medical || 0,
      pharmacy: row.pharmacy || 0,
      behavioral: row.behavioral || 0,
      total: row.total || 0,
    };
  });

  return NextResponse.json({
    stats,
    chartData,
    byCategory,
  });
}
