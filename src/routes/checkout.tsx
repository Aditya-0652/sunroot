import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · SUNROOT" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{5,6}$/, "Enter a valid pincode"),
  upi_txn_id: z.string().trim().min(6, "Enter the UPI reference number").max(50),
  notes: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [step, setStep] = useState<"details" | "pay">("details");
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    upi_txn_id: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: f.email || user.email || "",
        customer_name:
          f.customer_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          "",
      }));
    }
  }, [user]);

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("id, brand_tagline, shipping_fee_inr, free_shipping_threshold_inr, updated_at")
        .eq("id", 1)
        .maybeSingle();
      return data;
    },
  });

  const { data: upi } = useQuery({
    queryKey: ["upi_settings"],
    enabled: step === "pay",
    queryFn: async () => {
      const { data } = await (supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: Array<{ upi_id: string; upi_payee_name: string; qr_image_url: string | null }> | null }>)(
        "get_upi_settings",
      );
      return data?.[0] ?? null;
    },
  });

  const shipping = useMemo(() => {
    const threshold = settings?.free_shipping_threshold_inr ?? 499;
    const fee = settings?.shipping_fee_inr ?? 20;
    if (subtotal <= 0) return 0;
    return subtotal >= threshold ? 0 : fee;
  }, [subtotal, settings]);

  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-primary">Your cart is empty</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-primary">
          ← Continue shopping
        </Link>
      </div>
    );
  }

  const goToPayment = () => {
    const partial = { ...form };
    delete (partial as Partial<typeof form>).upi_txn_id;
    const res = schema.omit({ upi_txn_id: true }).safeParse(partial);
    if (!res.success) {
      toast.error(res.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    const res = schema.safeParse(form);
    if (!res.success) {
      toast.error(res.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    setSubmitting(true);
    try {
      // Upload screenshot to private bucket; store only the storage path
      const ext = screenshot.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, screenshot, { upsert: false, contentType: screenshot.type });
      if (upErr) throw upErr;

      // Server-side place_order RPC recomputes prices, shipping and totals
      // from the products + site_settings tables. The client cannot manipulate
      // the order total — it only supplies product IDs and quantities.
      const { data: orderNumber, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: Error | null }>)("place_order", {
        p_customer_name: form.customer_name.trim(),
        p_email: form.email.trim(),
        p_phone: form.phone.trim(),
        p_address_line1: form.address_line1.trim(),
        p_address_line2: form.address_line2?.trim() || null,
        p_city: form.city.trim(),
        p_state: form.state.trim(),
        p_pincode: form.pincode.trim(),
        p_upi_txn_id: form.upi_txn_id.trim(),
        p_payment_screenshot_url: path,
        p_notes: form.notes?.trim() || null,
        p_items: items.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
        })),
      });
      if (error || !orderNumber) throw error ?? new Error("Could not place order");

      clear();
      navigate({
        to: "/order-success/$orderNumber",
        params: { orderNumber },
      });
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-4xl font-semibold text-primary">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "details" ? (
            <section className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-serif text-xl font-semibold text-primary">Delivery details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} className="sm:col-span-2" />
                <Field label="Address line 1" value={form.address_line1} onChange={(v) => setForm({ ...form, address_line1: v })} className="sm:col-span-2" />
                <Field label="Address line 2 (optional)" value={form.address_line2} onChange={(v) => setForm({ ...form, address_line2: v })} className="sm:col-span-2" />
                <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} />
              </div>
              <div className="mt-4">
                <Label className="mb-1.5 block text-sm">Order notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything we should know?"
                  rows={3}
                />
              </div>
              <Button onClick={goToPayment} size="lg" className="mt-6 w-full">
                Continue to payment
              </Button>
            </section>
          ) : (
            <section className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-serif text-xl font-semibold text-primary">Pay via UPI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay <span className="font-semibold text-foreground">{inr(total)}</span> using any UPI app — scan the QR or send to the UPI ID below.
              </p>

              <div className="mt-5 grid gap-4 rounded-xl bg-[oklch(0.97_0.02_230)] p-5 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-white">
                  {upi?.qr_image_url ? (
                    <img src={upi.qr_image_url} alt="UPI QR" className="h-full w-full object-contain" />
                  ) : (
                    <div className="grid h-full place-items-center p-4 text-center text-xs text-muted-foreground">
                      QR code not set yet — please contact us
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">UPI ID</p>
                  <p className="mt-1 select-all break-all font-mono text-base font-semibold text-foreground">
                    {upi?.upi_id || "Not set yet"}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Payee</p>
                  <p className="font-medium">{upi?.upi_payee_name || "SUNROOT"}</p>
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
                  <p className="font-semibold">{inr(total)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <Label className="mb-1.5 block text-sm">UPI transaction / reference ID</Label>
                  <Input
                    value={form.upi_txn_id}
                    onChange={(e) => setForm({ ...form, upi_txn_id: e.target.value })}
                    placeholder="Paste the 12-digit UPI ref number from your app"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Payment screenshot</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload the success screenshot from your UPI app so we can verify.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Back
                </Button>
                <Button onClick={placeOrder} disabled={submitting} size="lg" className="flex-1">
                  {submitting ? "Placing order…" : "Place order"}
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6 lg:sticky lg:top-20">
          <h3 className="font-serif text-lg font-semibold text-primary">Summary</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((it) => (
              <li key={it.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {it.name} <span className="text-xs">× {it.quantity}</span>
                </span>
                <span className="font-medium">{inr(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4 border-border/60" />
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={inr(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : inr(shipping)} />
          </dl>
          <hr className="my-4 border-border/60" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-2xl font-semibold text-primary">{inr(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
