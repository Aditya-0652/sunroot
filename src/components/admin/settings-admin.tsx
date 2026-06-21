import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndSign } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Settings = {
  id: number;
  upi_id: string;
  upi_payee_name: string;
  qr_image_url: string | null;
  brand_tagline: string;
  shipping_fee_inr: number;
  free_shipping_threshold_inr: number;
};

export function SettingsAdmin() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await (supabase.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: Settings | null }>)("admin_get_settings");
    if (data) setS(data as Settings);
  };

  useEffect(() => {
    load();
  }, []);

  if (!s) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const save = async () => {
    setSaving(true);
    try {
      let qrUrl = s.qr_image_url;
      if (qrFile) {
        qrUrl = await uploadAndSign("site-assets", `upi-qr-${Date.now()}.${qrFile.name.split(".").pop()}`, qrFile);
      }
      const { error } = await supabase
        .from("site_settings")
        .update({
          upi_id: s.upi_id.trim(),
          upi_payee_name: s.upi_payee_name.trim() || "SUNROOT",
          qr_image_url: qrUrl,
          brand_tagline: s.brand_tagline.trim(),
          shipping_fee_inr: Math.max(0, Math.round(s.shipping_fee_inr)),
          free_shipping_threshold_inr: Math.max(0, Math.round(s.free_shipping_threshold_inr)),
        })
        .eq("id", 1);
      if (error) throw error;
      toast.success("Settings saved");
      setQrFile(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6">
      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">UPI payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown to customers at checkout. Upload your UPI QR image and enter your UPI ID.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <Label className="mb-1.5 block text-sm">UPI ID</Label>
            <Input
              value={s.upi_id}
              onChange={(e) => setS({ ...s, upi_id: e.target.value })}
              placeholder="yourname@okhdfcbank"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Payee name</Label>
            <Input value={s.upi_payee_name} onChange={(e) => setS({ ...s, upi_payee_name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">UPI QR image</Label>
            {s.qr_image_url && !qrFile && (
              <img
                src={s.qr_image_url}
                alt="UPI QR"
                className="mb-2 h-40 w-40 rounded-md border border-border bg-white object-contain p-2"
              />
            )}
            <Input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Shipping</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-sm">Shipping fee (₹)</Label>
            <Input
              type="number"
              min={0}
              value={s.shipping_fee_inr}
              onChange={(e) => setS({ ...s, shipping_fee_inr: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Free shipping above (₹)</Label>
            <Input
              type="number"
              min={0}
              value={s.free_shipping_threshold_inr}
              onChange={(e) => setS({ ...s, free_shipping_threshold_inr: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Storefront</h2>
        <div className="mt-4">
          <Label className="mb-1.5 block text-sm">Homepage tagline</Label>
          <Textarea
            rows={3}
            value={s.brand_tagline}
            onChange={(e) => setS({ ...s, brand_tagline: e.target.value })}
          />
        </div>
      </section>

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
