"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SpendingChartProps {
  data: { month: string; medical: number; pharmacy: number; behavioral: number }[];
}

function formatDollar(value: number) {
  return `$${(value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Monthly Spending Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={formatDollar} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(value: number) => formatDollar(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="medical" stroke="#3b82f6" strokeWidth={2} dot={false} name="Medical" />
              <Line type="monotone" dataKey="pharmacy" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Pharmacy" />
              <Line type="monotone" dataKey="behavioral" stroke="#ec4899" strokeWidth={2} dot={false} name="Behavioral" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
