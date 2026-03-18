import { db } from "@/db";
import { employees, plans, claims } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/constants";
import { Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employeeData = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      coverageTier: employees.coverageTier,
      status: employees.status,
      planName: plans.name,
      planType: plans.type,
      totalSpend: sql<number>`coalesce(sum(${claims.paidAmount}), 0)`,
      claimCount: sql<number>`count(${claims.id})`,
    })
    .from(employees)
    .leftJoin(plans, eq(employees.planId, plans.id))
    .leftJoin(claims, eq(employees.id, claims.employeeId))
    .groupBy(employees.id)
    .orderBy(sql`sum(${claims.paidAmount}) desc`)
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">
            Plan members sorted by total spend
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Claims</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeData.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <Link href={`/employees/${emp.id}`} className="font-medium text-blue-600 hover:underline">
                      {emp.firstName} {emp.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{emp.employeeCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {emp.planName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {emp.coverageTier.replace("+", " + ")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.status === "active" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">
                    {formatCents(emp.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {emp.claimCount}
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
