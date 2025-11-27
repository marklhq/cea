"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Trophy, Search, ArrowRightLeft } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
  },
  {
    href: "/lookup",
    label: "Lookup",
    icon: Search,
  },
  {
    href: "/movements",
    label: "Movements",
    icon: ArrowRightLeft,
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">CEA Analytics</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Singapore Property Transactions
          </span>
        </div>
      </div>
    </header>
  );
}

