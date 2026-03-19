"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, FileText, ClipboardList, DollarSign, Shield, Heart } from "lucide-react";
import type { EobResponse, EobSection } from "@/lib/ai/schemas";

type EOBSummaryProps = {
  readonly employeeName: string;
  readonly planName: string;
  readonly planType: string;
  readonly deductible: number;
  readonly oopMax: number;
  readonly totalPaid: number;
  readonly totalMemberPaid: number;
  readonly claimCount: number;
};

const SECTION_ICONS = {
  clipboard: ClipboardList,
  dollar: DollarSign,
  shield: Shield,
  heart: Heart,
} as const;

const SECTION_COLORS = {
  clipboard: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
  dollar: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
  shield: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
  heart: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
} as const;

function SectionCard({ section }: { readonly section: EobSection }) {
  const Icon = SECTION_ICONS[section.icon];
  const colorClass = SECTION_COLORS[section.icon];

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={`rounded-md p-1.5 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold">{section.heading}</h4>
      </div>
      {section.highlight && (
        <div className="flex items-baseline gap-2 py-1">
          <span className="text-2xl font-bold tracking-tight">{section.highlight.value}</span>
          <span className="text-xs text-muted-foreground">{section.highlight.label}</span>
        </div>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
    </div>
  );
}

export function EOBSummary({
  employeeName,
  planName,
  planType,
  deductible,
  oopMax,
  totalPaid,
  totalMemberPaid,
  claimCount,
}: EOBSummaryProps) {
  const [summary, setSummary] = useState<EobResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/eob-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName,
          planName,
          planType,
          deductible,
          oopMax,
          totalPaid,
          totalMemberPaid,
          claimCount,
        }),
      });
      if (res.ok) {
        const data: EobResponse = await res.json();
        setSummary(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-200 dark:border-purple-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Plain-English Benefits Summary
        </CardTitle>
        {!summary && (
          <Button onClick={handleGenerate} disabled={loading} size="sm" variant="outline">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate EOB Summary
              </>
            )}
          </Button>
        )}
      </CardHeader>
      {summary && (
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">{summary.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.sections.map((section) => (
              <SectionCard key={section.heading} section={section} />
            ))}
          </div>
          {summary.footer && (
            <p className="text-xs text-muted-foreground italic pt-2 border-t">
              {summary.footer}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
