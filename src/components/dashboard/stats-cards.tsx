import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatNumber } from "@/lib/constants";
import { FileText, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  totalClaims: number;
  totalSpend: number;
  avgClaimCost: number;
  anomalyCount: number;
  pendingCount: number;
}

export function StatsCards({ totalClaims, totalSpend, avgClaimCost, anomalyCount, pendingCount }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Claims",
      value: formatNumber(totalClaims),
      description: `${pendingCount} pending review`,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Spend",
      value: formatCents(totalSpend),
      description: "Plan year to date",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Avg Claim Cost",
      value: formatCents(avgClaimCost),
      description: "Per claim average",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Anomalies Detected",
      value: formatNumber(anomalyCount),
      description: "Requires attention",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg ${card.bg} p-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
