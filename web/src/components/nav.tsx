"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/opportunities", label: "Opportunities" },
    { href: "/profile", label: "Profile" },
    ...(session?.user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          DAC <span className="text-primary">SkillX</span>
        </Link>
        {status === "authenticated" && (
          <nav className="flex items-center gap-6 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "font-medium text-foreground" : "text-muted-foreground"}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </nav>
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
    </header>
  );
}
