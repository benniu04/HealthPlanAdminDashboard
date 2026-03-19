import { db } from "@/db";
import { plans, employees, claims } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/constants";
import { Shield, Users, DollarSign, Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const planData = await db
    .select({
      id: plans.id,
      name: plans.name,
      type: plans.type,
      deductibleInd: plans.deductibleInd,
      deductibleFam: plans.deductibleFam,
      oopMaxInd: plans.oopMaxInd,
      oopMaxFam: plans.oopMaxFam,
      coinsurance: plans.coinsurance,
      copayPrimary: plans.copayPrimary,
      copaySpecialist: plans.copaySpecialist,
      copayER: plans.copayER,
      rxTier1: plans.rxTier1,
      rxTier2: plans.rxTier2,
      rxTier3: plans.rxTier3,
      stopLossSpec: plans.stopLossSpec,
      stopLossAgg: plans.stopLossAgg,
      status: plans.status,
      effectiveDate: plans.effectiveDate,
      terminationDate: plans.terminationDate,
    })
    .from(plans);

  // Get enrollment counts and spending per plan
  const planStats = await Promise.all(
    planData.map(async (plan) => {
      const [enrollmentStats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.planId, plan.id));

      const [spendStats] = await db
        .select({
          total: sql<number>`coalesce(sum(${claims.paidAmount}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(claims)
        .where(eq(claims.planId, plan.id));

      return { ...plan, enrolled: enrollmentStats.count, totalSpend: spendStats.total, claimCount: spendStats.count };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plan Configurations</h2>
          <p className="text-muted-foreground">
            Manage your self-funded health plan designs
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {planStats.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${plan.type === "PPO" ? "bg-blue-500" : "bg-purple-500"}`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.type} | {plan.effectiveDate} to {plan.terminationDate}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enrollment & Spend */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{plan.enrolled}</p>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{formatCents(plan.totalSpend)}</p>
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Heart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{plan.claimCount}</p>
                  <p className="text-xs text-muted-foreground">Claims</p>
                </div>
              </div>

              {/* Benefit Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Deductibles & Out-of-Pocket</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Individual Deductible</span>
                    <span className="font-medium">{formatCents(plan.deductibleInd)}</span>
                  </div>
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Family Deductible</span>
                    <span className="font-medium">{formatCents(plan.deductibleFam)}</span>
                  </div>
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Individual OOP Max</span>
                    <span className="font-medium">{formatCents(plan.oopMaxInd)}</span>
                  </div>
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Family OOP Max</span>
                    <span className="font-medium">{formatCents(plan.oopMaxFam)}</span>
                  </div>
                </div>
              </div>

              {plan.type === "PPO" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Copays</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex justify-between rounded border p-2">
                      <span className="text-muted-foreground">Primary</span>
                      <span className="font-medium">{formatCents(plan.copayPrimary)}</span>
                    </div>
                    <div className="flex justify-between rounded border p-2">
                      <span className="text-muted-foreground">Specialist</span>
                      <span className="font-medium">{formatCents(plan.copaySpecialist)}</span>
                    </div>
                    <div className="flex justify-between rounded border p-2">
                      <span className="text-muted-foreground">ER</span>
                      <span className="font-medium">{formatCents(plan.copayER)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Stop-Loss Protection</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Specific</span>
                    <span className="font-medium">{formatCents(plan.stopLossSpec)}</span>
                  </div>
                  <div className="flex justify-between rounded border p-2">
                    <span className="text-muted-foreground">Aggregate</span>
                    <span className="font-medium">{formatCents(plan.stopLossAgg)}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Coinsurance: </span>
                <span className="font-medium">{(plan.coinsurance * 100).toFixed(0)}% plan / {((1 - plan.coinsurance) * 100).toFixed(0)}% member</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
