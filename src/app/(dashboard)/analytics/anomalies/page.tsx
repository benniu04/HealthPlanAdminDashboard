import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AnomalyDetectionButton } from "@/components/ai/anomaly-detection-button";

export const dynamic = "force-dynamic";

export default async function AnomaliesPage() {
  const anomalousClaims = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      billedAmount: claims.billedAmount,
      paidAmount: claims.paidAmount,
      serviceCategory: claims.serviceCategory,
      description: claims.description,
      anomalyReason: claims.anomalyReason,
      status: claims.status,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      providerName: providers.name,
    })
    .from(claims)
    .leftJoin(employees, eq(claims.employeeId, employees.id))
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .where(eq(claims.isAnomalous, true))
    .orderBy(desc(claims.billedAmount))
    .limit(100);

  // Group by reason
  const reasonGroups: Record<string, typeof anomalousClaims> = {};
  for (const claim of anomalousClaims) {
    const reason = claim.anomalyReason || "Unknown";
    if (!reasonGroups[reason]) reasonGroups[reason] = [];
    reasonGroups[reason].push(claim);
  }

  const [stats] = await db
    .select({
      totalAnomalous: sql<number>`count(*)`,
      totalExcessSpend: sql<number>`sum(${claims.billedAmount})`,
    })
    .from(claims)
    .where(eq(claims.isAnomalous, true));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Anomaly Detection</h2>
            <p className="text-muted-foreground">
              {stats.totalAnomalous} anomalous claims detected with {formatCents(stats.totalExcessSpend)} in potentially excess charges.
            </p>
          </div>
        </div>
        <AnomalyDetectionButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(reasonGroups).map(([reason, groupClaims]) => {
          const totalAmount = groupClaims.reduce((sum, c) => sum + c.billedAmount, 0);
          return (
            <Card key={reason} className="border-amber-200 dark:border-amber-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {reason}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupClaims.length} claims</div>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCents(totalAmount)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Anomalous Claims</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead>Anomaly Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalousClaims.map((claim) => (
                <TableRow key={claim.id} className="bg-red-50/30 dark:bg-red-950/20">
                  <TableCell>
                    <Link href={`/claims/${claim.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {claim.claimNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {claim.employeeFirstName} {claim.employeeLastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {claim.providerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                    {claim.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{claim.serviceDate}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCents(claim.billedAmount)}</TableCell>
                  <TableCell>
                    <p className="text-xs text-red-700 dark:text-red-300 max-w-[200px]">{claim.anomalyReason}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
