import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndSign } from "@/lib/storage";
import { inr, slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Image as ImageIcon, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_inr: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
  cover_image_url: string | null;
  created_at: string;
};

type Media = { id: string; product_id: string; url: string; kind: "image" | "video"; sort_order: number };

const empty = {
  name: "",
  slug: "",
  description: "",
  price_inr: 0,
  stock: 0,
  is_active: true,
  sort_order: 0,
  cover_image_url: null as string | null,
};

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
  const [media, setMedia] = useState<Media[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty });
    setCoverFile(null);
    setMediaFiles(null);
    setMedia([]);
    setOpen(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price_inr: p.price_inr,
      stock: p.stock,
      is_active: p.is_active,
      sort_order: p.sort_order,
      cover_image_url: p.cover_image_url,
    });
    setCoverFile(null);
    setMediaFiles(null);
    const { data } = await supabase
      .from("product_media")
      .select("*")
      .eq("product_id", p.id)
      .order("sort_order", { ascending: true });
    setMedia((data ?? []) as Media[]);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (form.price_inr < 0) return toast.error("Price must be ≥ 0");

    setSaving(true);
    try {
      let coverUrl = form.cover_image_url;
      if (coverFile) {
        coverUrl = await uploadAndSign(
          "product-media",
          `covers/${crypto.randomUUID()}-${coverFile.name}`,
          coverFile,
        );
      }
      const slug = form.slug.trim() || slugify(form.name);
      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        price_inr: Math.round(form.price_inr),
        stock: Math.round(form.stock),
        is_active: form.is_active,
        sort_order: Math.round(form.sort_order),
        cover_image_url: coverUrl,
      };

      let productId: string;
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        productId = editing.id;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) throw error;
        productId = data.id;
      }

      // Upload additional media
      if (mediaFiles && mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const f = mediaFiles[i];
          const kind: "image" | "video" = f.type.startsWith("video") ? "video" : "image";
          const url = await uploadAndSign(
            "product-media",
            `gallery/${productId}/${crypto.randomUUID()}-${f.name}`,
            f,
          );
          await supabase
            .from("product_media")
            .insert({ product_id: productId, url, kind, sort_order: media.length + i });
        }
      }

      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    load();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  const deleteMedia = async (m: Media) => {
    await supabase.from("product_media").delete().eq("id", m.id);
    setMedia((prev) => prev.filter((x) => x.id !== m.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No products yet. Click "Add product" to create your first one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="m-auto mt-3 h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{inr(p.price_inr)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label className="mb-1.5 block text-sm">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">URL slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price_inr}
                  onChange={(e) => setForm({ ...form, price_inr: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                id="active"
              />
              <Label htmlFor="active" className="text-sm">
                Visible on store
              </Label>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm">Cover image</Label>
              {form.cover_image_url && !coverFile && (
                <img
                  src={form.cover_image_url}
                  alt=""
                  className="mb-2 h-28 w-28 rounded-md object-cover"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm">
                Add more images / videos (up to 5)
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Select up to 5 files — product photos from different angles and an
                optional short video. Hold Ctrl/Cmd to pick multiple.
              </p>
              {editing && media.length > 0 && (
                <div className="mb-2 grid grid-cols-5 gap-2">
                  {media.map((m) => (
                    <div key={m.id} className="relative">
                      {m.kind === "video" ? (
                        <video src={m.url} className="h-16 w-full rounded-md object-cover" />
                      ) : (
                        <img src={m.url} alt="" className="h-16 w-full rounded-md object-cover" />
                      )}
                      <button
                        onClick={() => deleteMedia(m)}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 5) {
                    toast.error("You can upload at most 5 files at a time");
                    e.target.value = "";
                    setMediaFiles(null);
                    return;
                  }
                  setMediaFiles(files);
                }}
              />
              {mediaFiles && mediaFiles.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {mediaFiles.length} file{mediaFiles.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
