import { db } from "@/db";
import { providers, claims } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/constants";
import { Building2, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providerData = await db
    .select({
      id: providers.id,
      name: providers.name,
      type: providers.type,
      specialty: providers.specialty,
      networkStatus: providers.networkStatus,
      city: providers.city,
      state: providers.state,
      avgCostIndex: providers.avgCostIndex,
      qualityRating: providers.qualityRating,
      npi: providers.npi,
      totalSpend: sql<number>`coalesce(sum(${claims.paidAmount}), 0)`,
      claimCount: sql<number>`count(${claims.id})`,
    })
    .from(providers)
    .leftJoin(claims, eq(providers.id, claims.providerId))
    .groupBy(providers.id)
    .orderBy(sql`sum(${claims.paidAmount}) desc`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Provider Directory</h2>
          <p className="text-muted-foreground">
            {providerData.length} providers in your network
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Cost Index</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Claims</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerData.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{provider.type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{provider.specialty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {provider.city}, {provider.state}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={provider.networkStatus === "in-network" ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {provider.networkStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {provider.qualityRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{provider.qualityRating.toFixed(1)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={provider.avgCostIndex > 1.5 ? "destructive" : provider.avgCostIndex > 1.2 ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {provider.avgCostIndex.toFixed(1)}x
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCents(provider.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {provider.claimCount}
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
