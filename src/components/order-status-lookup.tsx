import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import { Search } from "lucide-react";

type StatusRow = {
  order_number: string;
  status: string;
  customer_name: string;
  total_inr: number;
  created_at: string;
  updated_at: string;
  city: string;
  state: string;
};

const labelFor = (s: string) =>
  ({
    pending_review: "Awaiting verification",
    confirmed: "Payment confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  })[s] ?? s;

export function OrderStatusLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    try {
      const { data, error } = await supabase.rpc("lookup_order_status", {
        _order_number: orderNumber,
        _email: email,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setError("No order found. Please check your order number and email.");
      } else {
        setResult(row as StatusRow);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not look up order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[var(--color-brand-yellow)]/60 bg-white/70 p-5 shadow-sm">
      <h4 className="font-serif text-lg font-bold text-[var(--color-brand-brown)]">
        Track your prepaid order
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Enter your order number and email to see the current status.
      </p>
      <form onSubmit={lookup} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order # (e.g. SR-XXXX)"
          required
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email used to order"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange)]/90"
        >
          <Search className="mr-1 h-4 w-4" />
          {loading ? "…" : "Check"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {result && (
        <div className="mt-4 rounded-xl bg-[var(--color-brand-yellow)]/20 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Order {result.order_number}
              </p>
              <p className="font-semibold text-[var(--color-brand-brown)]">
                {result.customer_name}
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-brand-orange)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {labelFor(result.status)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              Total: <span className="font-semibold text-foreground">{inr(result.total_inr)}</span>
            </div>
            <div>
              Ship to:{" "}
              <span className="font-semibold text-foreground">
                {result.city}, {result.state}
              </span>
            </div>
            <div>Placed: {new Date(result.created_at).toLocaleDateString()}</div>
            <div>Updated: {new Date(result.updated_at).toLocaleDateString()}</div>
          </div>
        </div>
      )}
      {searched && !result && !error && !loading && null}
    </div>
  );
}
