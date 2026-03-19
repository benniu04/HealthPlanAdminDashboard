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
        <div className="h-80 text-muted-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: "currentColor" }} tickLine={{ stroke: "currentColor" }} />
              <YAxis tickFormatter={formatDollar} fontSize={12} tick={{ fill: "currentColor" }} tickLine={{ stroke: "currentColor" }} />
              <Tooltip
                formatter={(value) => formatDollar(Number(value))}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />
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
