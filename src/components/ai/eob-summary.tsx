"use client";

import { useCompletion } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, FileText } from "lucide-react";

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

function MarkdownLine({ line }: { readonly line: string }) {
  if (line.startsWith("**") && line.endsWith("**")) {
    return <h4 className="text-sm font-semibold mt-3 mb-1">{line.replace(/\*\*/g, "")}</h4>;
  }
  if (line.startsWith("*") && line.endsWith("*")) {
    return <p className="text-xs text-muted-foreground italic mt-4">{line.replace(/\*/g, "")}</p>;
  }
  if (line.trim() === "") return <br />;
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
        part.startsWith("**") ? (
          <strong key={j} className="text-foreground">{part.replace(/\*\*/g, "")}</strong>
        ) : (
          part
        )
      )}
    </p>
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
  const { completion, isLoading, complete } = useCompletion({
    api: "/api/ai/eob-summary",
    streamProtocol: "text",
  });

  const handleGenerate = () => {
    complete("", {
      body: {
        employeeName,
        planName,
        planType,
        deductible,
        oopMax,
        totalPaid,
        totalMemberPaid,
        claimCount,
      },
    });
  };

  return (
    <Card className="border-purple-200 dark:border-purple-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Plain-English Benefits Summary
        </CardTitle>
        {!completion && (
          <Button onClick={handleGenerate} disabled={isLoading} size="sm" variant="outline">
            {isLoading ? (
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
      {(completion || isLoading) && (
        <CardContent>
          <div className="rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 p-4">
            <div className="prose prose-sm max-w-none">
              {completion.split("\n").map((line: string, i: number) => (
                <MarkdownLine key={i} line={line} />
              ))}
              {isLoading && (
                <span className="inline-block w-2 h-4 bg-purple-500 dark:bg-purple-400 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
