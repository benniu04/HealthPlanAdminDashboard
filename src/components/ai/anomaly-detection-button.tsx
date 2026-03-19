"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

type DetectionResult = {
  readonly analyzed: number;
  readonly flagged: number;
  readonly results: ReadonlyArray<{
    readonly claimId: string;
    readonly anomalyReason: string | null;
    readonly confidence: number;
  }>;
};

export function AnomalyDetectionButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runDetection = async () => {
    setStatus("running");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/anomaly-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? "Detection failed");
        setStatus("error");
        return;
      }

      const data: DetectionResult = await res.json();
      setResult(data);
      setStatus("done");
      router.refresh();
    } catch {
      setErrorMessage("Network error");
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={runDetection}
        disabled={status === "running"}
        variant="outline"
        className="border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
      >
        {status === "running" ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Scanning Claims...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Run AI Detection
          </>
        )}
      </Button>

      {status === "done" && result && (
        <div className="flex items-center gap-2 text-sm">
          {result.flagged > 0 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-300">
                {result.flagged} anomalies found in {result.analyzed} claims
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">
                {result.analyzed} claims scanned — no anomalies found
              </span>
            </>
          )}
        </div>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
