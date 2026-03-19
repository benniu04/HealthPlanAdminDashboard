import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/constants";

interface ProviderCost {
  providerName: string | null;
  providerType: string | null;
  networkStatus: string | null;
  avgCostIndex: number | null;
  total: number;
  count: number;
  avg: number;
}

export function ProviderCostTable({ data }: { data: ProviderCost[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Providers by Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{p.providerName}</p>
                  <Badge
                    variant={p.networkStatus === "in-network" ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {p.networkStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.count} claims | Avg: {formatCents(Math.round(p.avg))}
                  {p.avgCostIndex && p.avgCostIndex > 1.5 && (
                    <span className="text-red-600 dark:text-red-400 ml-1">| Cost index: {p.avgCostIndex.toFixed(1)}x</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCents(p.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
