import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · SUNROOT Admin" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/admin" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/admin",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — signing in…");
        const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
        if (sErr) throw sErr;
        navigate({ to: "/admin" });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-orange)] via-[var(--color-brand-red)] to-[var(--color-brand-brown)]" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_20%,var(--color-brand-yellow)/0.4_0%,transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="font-serif text-3xl font-bold tracking-wide">
            <span style={{ color: "var(--color-brand-yellow)" }}>SUN</span>
            <span style={{ color: "var(--color-brand-brown)" }}>ROOT</span>
          </Link>
          <div>
            <p className="font-serif text-3xl leading-snug">
              "Rooted in love. Made to shine."
            </p>
            <p className="mt-3 text-sm opacity-80">— SUNROOT</p>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Owner access only</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-[var(--color-brand-orange)]">
            ← Back to store
          </Link>
          <h1 className="mt-6 font-serif text-3xl font-bold text-[var(--color-brand-brown)]">
            {mode === "signin" ? "Welcome back" : "Create owner account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your SUNROOT store."
              : "Set up the first owner account. You'll get admin access automatically."}
          </p>

          <div className="mt-6" />

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label className="mb-1.5 block text-sm">Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label className="mb-1.5 block text-sm">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-red)]"
              disabled={loading}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "signin" && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) return toast.error("Enter your email above first");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + "/reset-password",
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Check your inbox for a reset link");
                }}
                className="text-xs text-muted-foreground hover:text-[var(--color-brand-orange)]"
              >
                Forgot password?
              </button>
            </div>
          )}



          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Need an owner account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-[var(--color-brand-orange)] hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

