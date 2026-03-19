"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";

function UserInfo() {
  const { user } = useUser();
  return (
    <div>
      <p className="text-sm font-medium">{user?.fullName || "Loading..."}</p>
      <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
import {
  LayoutDashboard,
  FileText,
  Upload,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  Building2,
  Users,
  Shield,
  Heart,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Claims", href: "/claims", icon: FileText },
  { name: "Upload Claims", href: "/claims/upload", icon: Upload },
  { name: "Review Queue", href: "/claims/review", icon: CheckSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Anomalies", href: "/analytics/anomalies", icon: AlertTriangle },
  { name: "Providers", href: "/providers", icon: Building2 },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Plans", href: "/plans", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Heart className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-sm font-bold">HealthPlan Admin</h1>
          <p className="text-xs text-muted-foreground">Meridian Technologies</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Exact match only — prevents parent routes from highlighting on child pages
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <UserInfo />
        </div>
      </div>
    </aside>
  );
}
