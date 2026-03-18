"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";

export function ClaimActions({ claimId, currentStatus }: { claimId: string; currentStatus: string }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(action: "approve" | "deny") {
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Review Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Add notes (required for denial)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction("approve")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            onClick={() => handleAction("deny")}
            disabled={loading || !notes.trim()}
            variant="destructive"
            className="flex-1"
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Deny
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
