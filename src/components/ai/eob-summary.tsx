"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, FileText } from "lucide-react";
import { formatCents } from "@/lib/constants";

interface EOBSummaryProps {
  employeeName: string;
  planName: string;
  planType: string;
  deductible: number;
  oopMax: number;
  totalPaid: number;
  totalMemberPaid: number;
  claimCount: number;
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
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
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
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch {
      // Fallback demo summary
      setSummary(
        `**Benefits Summary for ${employeeName}**\n\n` +
        `You're enrolled in the **${planName}** (${planType} plan), which has been covering your healthcare costs this plan year.\n\n` +
        `**What your plan has covered so far:**\n` +
        `Your plan has processed ${claimCount} claims and paid ${formatCents(totalPaid)} toward your medical expenses. ` +
        `This means your insurance has been actively working to reduce your out-of-pocket costs.\n\n` +
        `**What you've paid:**\n` +
        `Your total out-of-pocket responsibility has been ${formatCents(totalMemberPaid)}, which includes your ` +
        `deductible payments, coinsurance (your share after the deductible), and any copays.\n\n` +
        `**Understanding your deductible:**\n` +
        `Your individual deductible is ${formatCents(deductible)}. This is the amount you pay before your plan starts ` +
        `sharing costs with you. Once you meet your deductible, the plan pays ${planType === "PPO" ? "80%" : "80%"} of ` +
        `covered services and you pay the remaining ${planType === "PPO" ? "20%" : "20%"}.\n\n` +
        `**Your safety net:**\n` +
        `Your out-of-pocket maximum is ${formatCents(oopMax)}. Once you've paid this much in a plan year, ` +
        `your plan covers 100% of remaining covered expenses. This protects you from catastrophic medical costs.\n\n` +
        `*If you have questions about a specific claim or your coverage, please contact your HR benefits team.*`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          Plain-English Benefits Summary
        </CardTitle>
        {!summary && (
          <Button onClick={generateSummary} disabled={loading} size="sm" variant="outline">
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
        <CardContent>
          <div className="rounded-lg bg-purple-50/50 border border-purple-100 p-4">
            <div className="prose prose-sm max-w-none">
              {summary.split("\n").map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <h4 key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace(/\*\*/g, "")}</h4>;
                }
                if (line.startsWith("*") && line.endsWith("*")) {
                  return <p key={i} className="text-xs text-muted-foreground italic mt-4">{line.replace(/\*/g, "")}</p>;
                }
                if (line.trim() === "") return <br key={i} />;
                return (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") ? (
                        <strong key={j} className="text-foreground">{part.replace(/\*\*/g, "")}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
