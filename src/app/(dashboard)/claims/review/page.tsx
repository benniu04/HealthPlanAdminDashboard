import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, CLAIM_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const reviewClaims = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      claimType: claims.claimType,
      status: claims.status,
      billedAmount: claims.billedAmount,
      paidAmount: claims.paidAmount,
      serviceCategory: claims.serviceCategory,
      description: claims.description,
      isAnomalous: claims.isAnomalous,
      anomalyReason: claims.anomalyReason,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      providerName: providers.name,
    })
    .from(claims)
    .leftJoin(employees, eq(claims.employeeId, employees.id))
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .where(or(eq(claims.status, "pending"), eq(claims.status, "in_review")))
    .orderBy(desc(claims.billedAmount))
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Queue</h2>
          <p className="text-muted-foreground">
            {reviewClaims.length} claims awaiting review, sorted by amount.
          </p>
        </div>
      </div>

      <Card>
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
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewClaims.map((claim) => {
                const statusConfig = CLAIM_STATUSES.find(s => s.value === claim.status);
                return (
                  <TableRow key={claim.id} className={claim.isAnomalous ? "bg-red-50/50 dark:bg-red-950/30" : ""}>
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
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {claim.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.serviceDate}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCents(claim.billedAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusConfig?.color || ""}`} variant="secondary">
                        {statusConfig?.label || claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.isAnomalous && (
                        <Badge variant="destructive" className="text-[10px]">anomaly</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
