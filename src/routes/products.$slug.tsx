import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus, Play } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (!product) return null;
      const { data: media } = await supabase
        .from("product_media")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true });
      return { product, media: media ?? [] };
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!data?.product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-primary">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-primary">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const { product, media } = data;
  const gallery = media.length
    ? media
    : product.cover_image_url
      ? [{ url: product.cover_image_url, kind: "image" as const, id: "cover" }]
      : [];
  const active = gallery[activeIdx];

  const handleAdd = () => {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price_inr,
        image: product.cover_image_url,
      },
      qty,
    );
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate({ to: "/checkout" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-[oklch(0.95_0.02_230)]">
            {active?.kind === "video" ? (
              <video src={active.url} controls className="h-full w-full object-cover" />
            ) : active ? (
              <img src={active.url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-serif text-4xl text-muted-foreground">
                SUNROOT
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((m: { id: string; url: string; kind: string }, i: number) => (
                <button
                  key={m.id}
                  onClick={() => setActiveIdx(i)}
                  className={`relative aspect-square overflow-hidden rounded-lg border ${
                    i === activeIdx ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                  } bg-[oklch(0.95_0.02_230)]`}
                >
                  {m.kind === "video" ? (
                    <>
                      <video src={m.url} className="h-full w-full object-cover" />
                      <Play className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
                    </>
                  ) : (
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-primary">
            {product.name}
          </h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-foreground">{inr(product.price_inr)}</span>
            {product.original_price_inr && product.original_price_inr > product.price_inr && (
              <>
                <span className="text-base text-muted-foreground line-through">{inr(product.original_price_inr)}</span>
                <span className="rounded-full bg-[var(--color-brand-red)]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-red)]">
                  Save {Math.round(((product.original_price_inr - product.price_inr) / product.original_price_inr) * 100)}%
                </span>
              </>
            )}
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center text-foreground hover:bg-accent rounded-l-full"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="grid h-10 w-10 place-items-center text-foreground hover:bg-accent rounded-r-full"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleAdd} disabled={product.stock <= 0} variant="outline" size="lg">
              Add to cart
            </Button>
            <Button onClick={handleBuyNow} disabled={product.stock <= 0} size="lg">
              Buy now
            </Button>
          </div>

          <div className="mt-8 rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
            <p>✓ Prepaid via UPI · Pay using any UPI app</p>
            <p>✓ Free shipping on orders above ₹499 — flat ₹20 below</p>
            <p>✓ Delivery in 3–7 days across India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
