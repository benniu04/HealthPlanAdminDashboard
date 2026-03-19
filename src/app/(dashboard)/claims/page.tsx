import { db } from "@/db";
import { claims, employees, providers } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, CLAIM_STATUSES, SERVICE_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { ClaimsFilters } from "@/components/claims/claims-filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>;
}

export default async function ClaimsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status;
  const category = params.category;
  const page = parseInt(params.page || "1");
  const perPage = 25;

  const conditions = [];
  if (status) conditions.push(eq(claims.status, status));
  if (category) conditions.push(eq(claims.serviceCategory, category));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const allClaims = await db
    .select({
      id: claims.id,
      claimNumber: claims.claimNumber,
      serviceDate: claims.serviceDate,
      claimType: claims.claimType,
      status: claims.status,
      billedAmount: claims.billedAmount,
      allowedAmount: claims.allowedAmount,
      paidAmount: claims.paidAmount,
      memberResponsibility: claims.memberResponsibility,
      cptCode: claims.cptCode,
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
    .orderBy(desc(claims.serviceDate))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(claims)
    .where(where);

  const totalPages = Math.ceil(count / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Claims</h2>
        <p className="text-muted-foreground">
          {count.toLocaleString()} total claims
        </p>
      </div>

      <ClaimsFilters currentStatus={status} currentCategory={category} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allClaims.map((claim) => {
                const statusConfig = CLAIM_STATUSES.find(s => s.value === claim.status);
                const categoryConfig = SERVICE_CATEGORIES.find(c => c.value === claim.serviceCategory);
                return (
                  <TableRow key={claim.id} className={claim.isAnomalous ? "bg-red-50/50 dark:bg-red-950/30" : ""}>
                    <TableCell>
                      <Link href={`/claims/${claim.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {claim.claimNumber}
                      </Link>
                      {claim.isAnomalous && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">anomaly</Badge>
                      )}
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
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {categoryConfig?.label || claim.serviceCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/claims?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), page: String(page - 1) })}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/claims?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), page: String(page + 1) })}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
