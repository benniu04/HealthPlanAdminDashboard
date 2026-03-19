"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, FileText, User, Building2, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchResults = {
  claims: ReadonlyArray<{ id: string; claimNumber: string; description: string | null; status: string }>;
  employees: ReadonlyArray<{ id: string; firstName: string; lastName: string; employeeCode: string }>;
  providers: ReadonlyArray<{ id: string; name: string; specialty: string | null; networkStatus: string }>;
};

const EMPTY_RESULTS: SearchResults = { claims: [], employees: [], providers: [] };

function hasResults(r: SearchResults): boolean {
  return r.claims.length > 0 || r.employees.length > 0 || r.providers.length > 0;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
        setIsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
    router.push(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <div ref={containerRef} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          )}
          <Input
            placeholder="Search claims, employees, providers..."
            className="w-80 pl-9"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          />

          {isOpen && query.length >= 2 && (
            <div className="absolute top-full left-0 mt-1 w-96 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
              {!hasResults(results) && !isLoading && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              )}

              {results.claims.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Claims</p>
                  {results.claims.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleNavigate(`/claims/${c.id}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.claimNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.description ?? c.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.employees.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Employees</p>
                  {results.employees.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleNavigate(`/employees/${e.id}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.firstName} {e.lastName}</p>
                        <p className="text-xs text-muted-foreground">{e.employeeCode}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.providers.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Providers</p>
                  {results.providers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleNavigate("/providers")}
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.specialty ?? p.networkStatus}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]" variant="destructive">
            3
          </Badge>
        </Button>
        <Badge variant="outline" className="text-xs">
          Plan Year 2025-2026
        </Badge>
      </div>
    </header>
  );
}
