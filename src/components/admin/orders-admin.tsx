import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createSignedUrl } from "@/lib/storage";
import { inr, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Eye } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal_inr: number;
  shipping_inr: number;
  total_inr: number;
  upi_txn_id: string | null;
  payment_screenshot_url: string | null;
  status: "pending" | "verified" | "shipped" | "cancelled";
  notes: string | null;
  created_at: string;
};

type Item = {
  product_name: string;
  unit_price_inr: number;
  quantity: number;
  line_total_inr: number;
};

const STATUSES = ["pending", "verified", "shipped", "cancelled"] as const;

export function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openOrder = async (o: Order) => {
    setActive(o);
    setOpen(true);
    setProofUrl(null);
    const { data } = await supabase
      .from("order_items")
      .select("product_name, unit_price_inr, quantity, line_total_inr")
      .eq("order_id", o.id);
    setItems((data ?? []) as Item[]);
    if (o.payment_screenshot_url) {
      try {
        const url = await createSignedUrl("payment-proofs", o.payment_screenshot_url, 3600);
        setProofUrl(url);
      } catch {
        setProofUrl(null);
      }
    }
  };

  const updateStatus = async (o: Order, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    if (active?.id === o.id) setActive({ ...o, status });
  };

  const exportCsv = async () => {
    // Pull all orders + items joined for the export
    const { data: rows } = await supabase
      .from("orders")
      .select(
        "order_number, status, customer_name, email, phone, address_line1, address_line2, city, state, pincode, subtotal_inr, shipping_inr, total_inr, upi_txn_id, notes, created_at, order_items(product_name, unit_price_inr, quantity, line_total_inr)",
      )
      .order("created_at", { ascending: false });

    const header = [
      "Order #",
      "Date",
      "Status",
      "Customer",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Pincode",
      "Items",
      "Subtotal (INR)",
      "Shipping (INR)",
      "Total (INR)",
      "UPI Txn ID",
      "Notes",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const o of (rows ?? []) as (Order & { order_items: Item[] })[]) {
      const itemsStr = (o.order_items ?? [])
        .map((i) => `${i.product_name} x${i.quantity} @${i.unit_price_inr}`)
        .join(" | ");
      const addr = [o.address_line1, o.address_line2].filter(Boolean).join(", ");
      lines.push(
        [
          o.order_number,
          formatDate(o.created_at),
          o.status,
          o.customer_name,
          o.email,
          o.phone,
          addr,
          o.city,
          o.state,
          o.pincode,
          itemsStr,
          o.subtotal_inr,
          o.shipping_inr,
          o.total_inr,
          o.upi_txn_id ?? "",
          o.notes ?? "",
        ]
          .map(esc)
          .join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sunroot-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        <Button onClick={exportCsv} variant="outline">
          <Download className="mr-1.5 h-4 w-4" /> Export to Excel (.csv)
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{inr(o.total_inr)}</td>
                  <td className="px-4 py-3">
                    <StatusSelect order={o} onChange={(s) => updateStatus(o, s)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openOrder(o)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {active?.order_number} <span className="text-sm text-muted-foreground">· {active && formatDate(active.created_at)}</span>
            </DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Customer" value={active.customer_name} />
                <Info label="Phone" value={active.phone} />
                <Info label="Email" value={active.email} />
                <Info label="Status">
                  <StatusSelect order={active} onChange={(s) => updateStatus(active, s)} />
                </Info>
              </div>
              <Info label="Address">
                {[active.address_line1, active.address_line2, `${active.city}, ${active.state} ${active.pincode}`]
                  .filter(Boolean)
                  .join(", ")}
              </Info>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Items</div>
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {items.map((i, k) => (
                    <li key={k} className="flex justify-between p-3">
                      <span>
                        {i.product_name} <span className="text-xs text-muted-foreground">× {i.quantity}</span>
                      </span>
                      <span className="font-medium">{inr(i.line_total_inr)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 text-right">
                  <div className="text-xs text-muted-foreground">Subtotal: {inr(active.subtotal_inr)}</div>
                  <div className="text-xs text-muted-foreground">
                    Shipping: {active.shipping_inr === 0 ? "Free" : inr(active.shipping_inr)}
                  </div>
                  <div className="font-serif text-xl font-semibold text-primary">{inr(active.total_inr)}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="UPI Txn ID">
                  <span className="font-mono">{active.upi_txn_id || "—"}</span>
                </Info>
                <Info label="Payment screenshot">
                  {proofUrl ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      View image
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No image</span>
                  )}
                </Info>
              </div>

              {active.notes && <Info label="Customer notes">{active.notes}</Info>}

              {proofUrl && (
                <img
                  src={proofUrl}
                  alt="Payment proof"
                  className="max-h-80 rounded-lg border border-border object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusSelect({ order, onChange }: { order: Order; onChange: (s: Order["status"]) => void }) {
  return (
    <Select value={order.status} onValueChange={(v) => onChange(v as Order["status"])}>
      <SelectTrigger className="h-8 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="capitalize">{s}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Info({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1">{children ?? value ?? "—"}</div>
    </div>
  );
}
