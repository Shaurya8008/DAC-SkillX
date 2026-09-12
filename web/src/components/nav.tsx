"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Menu, Rocket, ShieldCheck, User, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/opportunities": Rocket,
  "/profile": User,
  "/admin": ShieldCheck,
};

export function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/opportunities", label: "Opportunities" },
    { href: "/profile", label: "Profile" },
    ...(session?.user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl backdrop-saturate-150 dark:border-white/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>
          DAC <span className="text-primary">SkillX</span>
        </Link>

        {status === "authenticated" && (
          <>
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              {links.map((link) => {
                const Icon = ICONS[link.href as keyof typeof ICONS];
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors hover:text-foreground",
                      active ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {link.label}
                  </Link>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </nav>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md border sm:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </>
        )}

        {status === "unauthenticated" && (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground">
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Get started
            </Link>
          </div>
        )}
      </div>

      {status === "authenticated" && open && (
        <nav className="flex flex-col gap-1 border-t px-6 py-3 sm:hidden">
          {links.map((link) => {
            const Icon = ICONS[link.href as keyof typeof ICONS];
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
          >
            Sign out
          </Button>
        </nav>
      )}
    </header>
  );
}
