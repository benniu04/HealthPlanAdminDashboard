"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CLAIM_STATUSES, SERVICE_CATEGORIES } from "@/lib/constants";

interface ClaimsFiltersProps {
  currentStatus?: string;
  currentCategory?: string;
}

export function ClaimsFilters({ currentStatus, currentCategory }: ClaimsFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <Link href="/claims">
          <Badge variant={!currentStatus ? "default" : "outline"} className="cursor-pointer text-xs">
            All
          </Badge>
        </Link>
        {CLAIM_STATUSES.map((s) => (
          <Link key={s.value} href={`/claims?status=${s.value}${currentCategory ? `&category=${currentCategory}` : ""}`}>
            <Badge
              variant={currentStatus === s.value ? "default" : "outline"}
              className="cursor-pointer text-xs"
            >
              {s.label}
            </Badge>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Category:</span>
        <Link href={`/claims${currentStatus ? `?status=${currentStatus}` : ""}`}>
          <Badge variant={!currentCategory ? "default" : "outline"} className="cursor-pointer text-xs">
            All
          </Badge>
        </Link>
        {SERVICE_CATEGORIES.map((c) => (
          <Link key={c.value} href={`/claims?${currentStatus ? `status=${currentStatus}&` : ""}category=${c.value}`}>
            <Badge
              variant={currentCategory === c.value ? "default" : "outline"}
              className="cursor-pointer text-xs"
            >
              {c.label}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
