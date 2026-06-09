import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link to="/auth">Sign in</Link></Button>
              <Button asChild className="flex-1 bg-gradient-primary text-primary-foreground"><Link to="/auth">Start free</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}