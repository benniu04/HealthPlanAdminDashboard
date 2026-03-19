import { db } from "@/db";
import { claims } from "@/db/schema";
import { sql } from "drizzle-orm";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentClaims } from "@/components/dashboard/recent-claims";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [stats] = await db
    .select({
      totalClaims: sql<number>`count(*)`,
      totalSpend: sql<number>`sum(${claims.paidAmount})`,
      avgClaimCost: sql<number>`avg(${claims.paidAmount})`,
      anomalyCount: sql<number>`sum(case when ${claims.isAnomalous} = 1 then 1 else 0 end)`,
      pendingCount: sql<number>`sum(case when ${claims.status} = 'pending' or ${claims.status} = 'in_review' then 1 else 0 end)`,
    })
    .from(claims);

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

  return { stats, chartData };
}

export default async function DashboardPage() {
  const { stats, chartData } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your self-funded health plan performance.
        </p>
      </div>

      <StatsCards
        totalClaims={stats.totalClaims}
        totalSpend={stats.totalSpend}
        avgClaimCost={Math.round(stats.avgClaimCost)}
        anomalyCount={stats.anomalyCount}
        pendingCount={stats.pendingCount}
      />

      <SpendingChart data={chartData} />

      <RecentClaims />
    </div>
  );
}
