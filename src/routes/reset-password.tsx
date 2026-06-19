import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · SUNROOT" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery link drops tokens in URL hash; the JS client picks them up automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <Link to="/auth" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
        ← Back to sign in
      </Link>
      <h1 className="mt-6 font-serif text-3xl font-bold text-primary">Set a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter and confirm your new password below.
      </p>
      {!ready ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Waiting for your reset link… If you opened this page directly, please use the link from your
          password reset email.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Confirm new password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
