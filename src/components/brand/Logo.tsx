import { Recycle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
        <Recycle className="h-5 w-5" />
        <span className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 blur-md transition-opacity group-hover:opacity-60" />
      </span>
      <span className="text-lg">
        Waste<span className="gradient-text">IQ</span>
        <span className="text-muted-foreground"> AI</span>
      </span>
    </Link>
  );
}