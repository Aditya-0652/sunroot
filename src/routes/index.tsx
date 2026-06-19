import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Sparkles, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import logoAsset from "@/assets/sunroot-logo.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SUNROOT — Thoughtful learning products for kids" },
      {
        name: "description",
        content:
          "Shop SUNROOT's curated learning products for kids. Prepaid UPI orders, free shipping over ₹499 across India.",
      },
    ],
  }),
  component: Index,
});

type Product = {
  id: string;
  slug: string;
  name: string;
  price_inr: number;
  cover_image_url: string | null;
  description: string | null;
  stock: number;
};

function Index() {
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name,price_inr,cover_image_url,description,stock")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--color-brand-yellow)]/30 via-background to-[var(--color-brand-orange)]/25" />
        <div className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_15%_20%,var(--color-brand-yellow)_0%,transparent_45%),radial-gradient(circle_at_85%_30%,var(--color-brand-orange)_0%,transparent_50%),radial-gradient(circle_at_50%_90%,var(--color-brand-red)/0.3_0%,transparent_50%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1.2fr_1fr] md:items-center lg:py-32">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-orange)]/40 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[var(--color-brand-brown)]">
              ◆ Made for little explorers
            </p>
            <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span style={{ color: "var(--color-brand-yellow)" }}>SUN</span>
              <span style={{ color: "var(--color-brand-brown)" }}>ROOT</span>
              <br />
              <span className="text-3xl font-medium text-[var(--color-brand-brown)] sm:text-4xl lg:text-5xl">
                Learning, <span className="italic text-[var(--color-brand-orange)]">beautifully</span>{" "}
                designed for kids.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {settings?.brand_tagline ||
                "Rooted in love. Made to shine — SUNROOT crafts thoughtful learning products that nurture curiosity from day one."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-orange)] px-6 py-3 text-sm font-semibold text-black shadow-md transition hover:bg-[var(--color-brand-red)]"
              >
                Shop the collection <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#order-status"
                className="inline-flex items-center justify-center rounded-full border-2 border-[var(--color-brand-brown)] bg-white/70 px-6 py-3 text-sm font-semibold text-[var(--color-brand-brown)] transition hover:bg-[var(--color-brand-yellow)]/40"
              >
                Track my order
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" /> Curated by parents
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" /> Free shipping over ₹499
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" /> Prepaid UPI · Secure
              </span>
            </div>
          </div>

          <div className="relative mx-auto">
            <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-[var(--color-brand-yellow)] blur-3xl opacity-50" />
            <img
              src={logoAsset.url}
              alt="SUNROOT logo"
              className="h-64 w-64 rounded-full object-cover shadow-2xl ring-4 ring-white sm:h-80 sm:w-80 lg:h-96 lg:w-96"
            />
          </div>
        </div>
      </section>

      {/* Browse / Category strip */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Shop all", desc: "Every SUNROOT product", href: "#shop", color: "var(--color-brand-orange)" },
            { label: "Best sellers", desc: "Loved by parents", href: "#shop", color: "var(--color-brand-yellow)" },
            { label: "New arrivals", desc: "Fresh on the shelf", href: "#shop", color: "var(--color-brand-red)" },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="group rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderLeft: `4px solid ${c.color}` }}
            >
              <p className="font-serif text-lg font-bold text-[var(--color-brand-brown)]">
                {c.label}
              </p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)]">
                Browse <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="shop" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-brand-orange)]">
              The collection
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[var(--color-brand-brown)] sm:text-4xl">
              Shop all products
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
            <p className="font-serif text-2xl text-primary">The shelves are being prepared</p>
            <p className="mt-2 text-sm text-muted-foreground">
              New products coming soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Story */}
      <section id="story" className="border-t border-border/60 bg-[oklch(0.97_0.02_230)]">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Our story
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
            Small batch. Big curiosity.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Every SUNROOT product is chosen for one reason — it helps a child learn something new
            about the world. We work in small batches, ship across India, and obsess over the
            details so you can simply enjoy the moments of discovery with your kids.
          </p>
        </div>
      </section>
    </>
  );
}

function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-[oklch(0.95_0.02_230)]">
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt={p.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-muted-foreground">
            SUNROOT
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl font-semibold text-primary">{p.name}</h3>
        {p.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">{inr(p.price_inr)}</span>
          {p.stock <= 0 ? (
            <span className="text-xs uppercase tracking-wider text-destructive">Sold out</span>
          ) : (
            <span className="text-xs uppercase tracking-[0.18em] text-[oklch(0.5_0.1_85)]">
              View →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
