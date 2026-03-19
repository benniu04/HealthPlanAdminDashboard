"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type ExportButtonProps = {
  readonly status?: string;
  readonly category?: string;
};

export function ExportButton({ status, category }: ExportButtonProps) {
  const handleExport = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);

    const query = params.toString();
    const url = `/api/claims/export${query ? `?${query}` : ""}`;
    window.location.href = url;
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
