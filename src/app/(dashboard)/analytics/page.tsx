import { db } from "@/db";
import { claims, providers } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_CATEGORIES, formatCents } from "@/lib/constants";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { ProviderCostTable } from "@/components/analytics/provider-cost-table";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const monthlySpending = await db
    .select({
      month: sql<string>`substr(${claims.serviceDate}, 1, 7)`,
      medical: sql<number>`sum(case when ${claims.claimType} = 'medical' then ${claims.paidAmount} else 0 end)`,
      pharmacy: sql<number>`sum(case when ${claims.claimType} = 'pharmacy' then ${claims.paidAmount} else 0 end)`,
      behavioral: sql<number>`sum(case when ${claims.claimType} = 'behavioral' then ${claims.paidAmount} else 0 end)`,
    })
    .from(claims)
    .groupBy(sql`substr(${claims.serviceDate}, 1, 7)`)
    .orderBy(sql`substr(${claims.serviceDate}, 1, 7)`);

  const byCategory = await db
    .select({
      category: claims.serviceCategory,
      total: sql<number>`sum(${claims.paidAmount})`,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${claims.paidAmount})`,
    })
    .from(claims)
    .groupBy(claims.serviceCategory)
    .orderBy(sql`sum(${claims.paidAmount}) desc`);

  const providerSpending = await db
    .select({
      providerName: providers.name,
      providerType: providers.type,
      networkStatus: providers.networkStatus,
      avgCostIndex: providers.avgCostIndex,
      total: sql<number>`sum(${claims.paidAmount})`,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${claims.paidAmount})`,
    })
    .from(claims)
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .groupBy(providers.id)
    .orderBy(sql`sum(${claims.paidAmount}) desc`)
    .limit(15);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = monthlySpending.map((row) => {
    const monthNum = parseInt(row.month.split("-")[1]) - 1;
    return {
      month: monthNames[monthNum],
      medical: row.medical || 0,
      pharmacy: row.pharmacy || 0,
      behavioral: row.behavioral || 0,
    };
  });

  const categoryData = byCategory.map((row) => {
    const config = SERVICE_CATEGORIES.find(c => c.value === row.category);
    return {
      name: config?.label || row.category || "Unknown",
      value: row.total,
      count: row.count,
      avg: Math.round(row.avg),
      color: config?.color || "#94a3b8",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Spending Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive view of plan spending patterns and cost drivers.
        </p>
      </div>

      <SpendingChart data={chartData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdown data={categoryData} />
        <ProviderCostTable data={providerSpending} />
      </div>
    </div>
  );
}
