import { db } from "@/db";
import { aiInsights } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/constants";
import { Brain, TrendingDown, AlertTriangle, Lightbulb, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

const typeConfig: Record<string, { icon: typeof Brain; label: string; color: string }> = {
  cost_saving: { icon: DollarSign, label: "Cost Savings", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" },
  anomaly_alert: { icon: AlertTriangle, label: "Anomaly Alert", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" },
  plan_design: { icon: Lightbulb, label: "Plan Design", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" },
  provider_switch: { icon: TrendingDown, label: "Provider Switch", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200" },
  trend_warning: { icon: AlertTriangle, label: "Trend Warning", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200" },
};

const severityColors: Record<string, string> = {
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
  critical: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
};

export default async function AIInsightsPage() {
  const insights = await db
    .select()
    .from(aiInsights)
    .orderBy(desc(aiInsights.createdAt));

  const totalSavings = insights.reduce((sum, i) => sum + (i.estimatedSavings || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Insights & Recommendations</h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your health plan data. Total potential savings: {formatCents(totalSavings)}/year
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700 dark:text-green-300">Total Potential Savings</p>
            <p className="text-3xl font-bold text-green-800 dark:text-green-200">{formatCents(totalSavings)}<span className="text-sm font-normal">/year</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Insights</p>
            <p className="text-3xl font-bold">{insights.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {insights.filter(i => i.severity === "critical").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const config = typeConfig[insight.insightType] || typeConfig.cost_saving;
          const Icon = config.icon;
          return (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${config.color.split(" ")[0]}`}>
                      <Icon className={`h-5 w-5 ${config.color.split(" ")[1]}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${severityColors[insight.severity]}`} variant="secondary">
                      {insight.severity}
                    </Badge>
                    <Badge className={`text-xs ${config.color}`} variant="secondary">
                      {config.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div
                    className="text-sm text-muted-foreground whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: insight.detail
                        .replace(/## (.*)/g, '<h3 class="text-base font-semibold text-foreground mt-4 mb-2">$1</h3>')
                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold text-foreground mt-3 mb-1">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                        .replace(/\n- /g, '\n<br/>• ')
                        .replace(/\n(\d+)\. /g, '\n<br/>$1. ')
                    }}
                  />
                </div>
                {insight.estimatedSavings && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/50 p-3 border border-green-200 dark:border-green-700">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Estimated Annual Savings</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCents(insight.estimatedSavings)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
