import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/constants";
import { Brain, AlertTriangle, TrendingDown, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AIInsight } from "@/types";

const typeIcons: Record<string, typeof Brain> = {
  cost_saving: TrendingDown,
  anomaly_alert: AlertTriangle,
  plan_design: Lightbulb,
  provider_switch: TrendingDown,
  trend_warning: AlertTriangle,
};

const severityColors: Record<string, string> = {
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
  critical: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
};

export function InsightsWidget({ insights }: { insights: AIInsight[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          AI Insights
        </CardTitle>
        <Link href="/ai-insights" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = typeIcons[insight.insightType] || Brain;
          return (
            <div key={insight.id} className="flex gap-3 rounded-lg border p-3">
              <div className="mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{insight.title}</p>
                  <Badge className={`shrink-0 text-[10px] ${severityColors[insight.severity]}`} variant="secondary">
                    {insight.severity}
                  </Badge>
                </div>
                {insight.estimatedSavings && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Est. savings: {formatCents(insight.estimatedSavings)}/yr
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
