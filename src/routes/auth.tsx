import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — WasteIQ AI" },
    { name: "description", content: "Sign in to your WasteIQ AI dashboard or create a free account." },
  ] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passSchema.safeParse(fd.get("password"));
    if (!email.success || !password.success) { toast.error("Enter a valid email and password (min 6 chars)."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passSchema.safeParse(fd.get("password"));
    const fullName = String(fd.get("full_name") ?? "").trim().slice(0, 100);
    const companyName = String(fd.get("company_name") ?? "").trim().slice(0, 120);
    if (!email.success || !password.success) { toast.error("Enter a valid email and password (min 6 chars)."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.data, password: password.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, company_name: companyName },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — welcome aboard.");
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error("Google sign-in failed.");
  }

  async function forgot() {
    const email = window.prompt("Enter your email to receive a reset link:");
    if (!email) return;
    const e = emailSchema.safeParse(email);
    if (!e.success) { toast.error("Invalid email"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(e.data, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Check your inbox for the reset link.");
  }

  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <Card className="border-border/60 bg-card p-6 shadow-elegant">
          <h1 className="text-center text-2xl font-semibold tracking-tight">Welcome to WasteIQ AI</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Sign in or create your free account.</p>

          <Button type="button" onClick={google} variant="outline" className="mt-6 w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11.8v3.6h5.1c-.2 1.4-1.6 4-5.1 4-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.8 0 2.9.8 3.6 1.4l2.4-2.4C16.6 5.6 14.6 4.7 12 4.7 7 4.7 3 8.7 3 13.7s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"/></svg>
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form className="mt-4 grid gap-3" onSubmit={signIn}>
                <div className="grid gap-2"><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" required /></div>
                <div className="grid gap-2"><Label htmlFor="si-password">Password</Label><Input id="si-password" name="password" type="password" required /></div>
                <button type="button" className="text-left text-xs text-primary hover:underline" onClick={forgot}>Forgot your password?</button>
                <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground">{loading ? "Signing in…" : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="mt-4 grid gap-3" onSubmit={signUp}>
                <div className="grid gap-2"><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="full_name" required /></div>
                <div className="grid gap-2"><Label htmlFor="su-company">Company name</Label><Input id="su-company" name="company_name" /></div>
                <div className="grid gap-2"><Label htmlFor="su-email">Work email</Label><Input id="su-email" name="email" type="email" required /></div>
                <div className="grid gap-2"><Label htmlFor="su-password">Password</Label><Input id="su-password" name="password" type="password" required minLength={6} /></div>
                <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground">{loading ? "Creating…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </Card>
      </section>
    </MarketingShell>
  );
}