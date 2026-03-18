import { db } from "@/db";
import { aiInsights } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/constants";
import { Brain, TrendingDown, AlertTriangle, Lightbulb, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

const typeConfig: Record<string, { icon: typeof Brain; label: string; color: string }> = {
  cost_saving: { icon: DollarSign, label: "Cost Savings", color: "bg-green-100 text-green-800" },
  anomaly_alert: { icon: AlertTriangle, label: "Anomaly Alert", color: "bg-red-100 text-red-800" },
  plan_design: { icon: Lightbulb, label: "Plan Design", color: "bg-blue-100 text-blue-800" },
  provider_switch: { icon: TrendingDown, label: "Provider Switch", color: "bg-purple-100 text-purple-800" },
  trend_warning: { icon: AlertTriangle, label: "Trend Warning", color: "bg-amber-100 text-amber-800" },
};

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
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
        <Brain className="h-6 w-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Insights & Recommendations</h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your health plan data. Total potential savings: {formatCents(totalSavings)}/year
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">Total Potential Savings</p>
            <p className="text-3xl font-bold text-green-800">{formatCents(totalSavings)}<span className="text-sm font-normal">/year</span></p>
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
            <p className="text-3xl font-bold text-red-600">
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
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 border border-green-200">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Estimated Annual Savings</p>
                      <p className="text-lg font-bold text-green-700">{formatCents(insight.estimatedSavings)}</p>
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
