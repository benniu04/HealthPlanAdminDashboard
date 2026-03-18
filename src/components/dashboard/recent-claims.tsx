import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, CLAIM_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export async function RecentClaims() {
  const recentClaims = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      status: claims.status,
      billedAmount: claims.billedAmount,
      paidAmount: claims.paidAmount,
      serviceCategory: claims.serviceCategory,
      description: claims.description,
      isAnomalous: claims.isAnomalous,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      providerName: providers.name,
    })
    .from(claims)
    .leftJoin(employees, eq(claims.employeeId, employees.id))
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .orderBy(desc(claims.createdAt))
    .limit(10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Claims</CardTitle>
        <Link href="/claims" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim #</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentClaims.map((claim) => {
              const statusConfig = CLAIM_STATUSES.find(s => s.value === claim.status);
              return (
                <TableRow key={claim.id}>
                  <TableCell>
                    <Link href={`/claims/${claim.id}`} className="font-medium text-blue-600 hover:underline">
                      {claim.claimNumber}
                    </Link>
                    {claim.isAnomalous && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">!</Badge>
                    )}
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
                  <TableCell className="text-sm text-muted-foreground">
                    {claim.serviceDate}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCents(claim.billedAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCents(claim.paidAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${statusConfig?.color || ""}`} variant="secondary">
                      {statusConfig?.label || claim.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
