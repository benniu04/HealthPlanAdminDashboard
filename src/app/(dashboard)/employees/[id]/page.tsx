import { db } from "@/db";
import { employees, plans, claims, providers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, CLAIM_STATUSES } from "@/lib/constants";
import { User, Shield, FileText } from "lucide-react";
import Link from "next/link";
import { EOBSummary } from "@/components/ai/eob-summary";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!employee) return notFound();

  const [plan] = await db.select().from(plans).where(eq(plans.id, employee.planId)).limit(1);

  const employeeClaims = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      status: claims.status,
      billedAmount: claims.billedAmount,
      paidAmount: claims.paidAmount,
      description: claims.description,
      serviceCategory: claims.serviceCategory,
      providerName: providers.name,
    })
    .from(claims)
    .leftJoin(providers, eq(claims.providerId, providers.id))
    .where(eq(claims.employeeId, id))
    .orderBy(desc(claims.serviceDate))
    .limit(20);

  const [spendStats] = await db
    .select({
      total: sql<number>`coalesce(sum(${claims.paidAmount}), 0)`,
      count: sql<number>`count(*)`,
      memberTotal: sql<number>`coalesce(sum(${claims.memberResponsibility}), 0)`,
    })
    .from(claims)
    .where(eq(claims.employeeId, id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {employee.firstName} {employee.lastName}
        </h2>
        <p className="text-muted-foreground">{employee.employeeCode} | {employee.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth</span>
              <span>{employee.dateOfBirth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hire Date</span>
              <span>{employee.hireDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coverage Tier</span>
              <span className="capitalize">{employee.coverageTier.replace("+", " + ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={employee.status === "active" ? "default" : "secondary"} className="text-[10px]">
                {employee.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Plan Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{plan.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deductible</span>
              <span>{formatCents(plan.deductibleInd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OOP Max</span>
              <span>{formatCents(plan.oopMaxInd)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Spending Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Claims</span>
              <span className="font-medium">{spendStats.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan Paid</span>
              <span className="font-medium text-green-600">{formatCents(spendStats.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Paid</span>
              <span className="font-medium text-amber-600">{formatCents(spendStats.memberTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <EOBSummary
        employeeName={`${employee.firstName} ${employee.lastName}`}
        planName={plan.name}
        planType={plan.type}
        deductible={plan.deductibleInd}
        oopMax={plan.oopMaxInd}
        totalPaid={spendStats.total}
        totalMemberPaid={spendStats.memberTotal}
        claimCount={spendStats.count}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claims History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeClaims.map((claim) => {
                const statusConfig = CLAIM_STATUSES.find(s => s.value === claim.status);
                return (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <Link href={`/claims/${claim.id}`} className="font-medium text-blue-600 hover:underline">
                        {claim.claimNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.providerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {claim.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.serviceDate}</TableCell>
                    <TableCell className="text-right text-sm">{formatCents(claim.billedAmount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCents(claim.paidAmount)}</TableCell>
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
    </div>
  );
}
