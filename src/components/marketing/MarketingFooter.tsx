import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            AI-powered circular economy intelligence for South African businesses.
          </p>
        </div>
        <FooterCol title="Product" links={[
          ["Features", "/features"],
          ["Pricing", "/pricing"],
        ]} />
        <FooterCol title="Company" links={[
          ["About", "/about"],
          ["Contact", "/contact"],
        ]} />
        <FooterCol title="Legal" links={[
          ["Privacy Policy", "/privacy"],
          ["Terms of Service", "/terms"],
        ]} />
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} WasteIQ AI. Built for a circular South Africa.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}