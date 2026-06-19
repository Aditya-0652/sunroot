import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductsAdmin } from "@/components/admin/products-admin";
import { OrdersAdmin } from "@/components/admin/orders-admin";
import { SettingsAdmin } from "@/components/admin/settings-admin";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · SUNROOT" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading, refreshAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    const claim = async () => {
      setClaiming(true);
      try {
        const { data, error } = await supabase.rpc("claim_admin");
        if (error) throw error;
        if (data) {
          toast.success("You are now the store owner");
          await refreshAdmin();
        } else {
          toast.error("Admin already claimed. Contact the store owner.");
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Could not claim admin");
      } finally {
        setClaiming(false);
      }
    };

    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-primary">Owner access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in as <span className="font-medium">{user.email}</span>, but you don't have
          admin access yet.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          If you're the SUNROOT owner and no one has claimed admin yet, click below to set yourself
          as the owner.
        </p>
        <Button onClick={claim} disabled={claiming} className="mt-6 w-full">
          {claiming ? "Checking…" : "Claim owner access"}
        </Button>
        <div className="mt-4 flex justify-center gap-3 text-xs">
          <button onClick={signOut} className="text-muted-foreground hover:text-primary">
            Sign out
          </button>
          <Link to="/" className="text-muted-foreground hover:text-primary">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Owner</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold text-primary">SUNROOT admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsAdmin />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrdersAdmin />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
