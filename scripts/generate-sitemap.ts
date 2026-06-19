// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://sunroot.lovable.app";

type Entry = {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
};

async function fetchProductSlugs(): Promise<Array<{ slug: string; updated_at?: string }>> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true);
    return (data ?? []) as Array<{ slug: string; updated_at?: string }>;
  } catch {
    return [];
  }
}

function render(entries: Entry[]) {
  const urls = entries
    .map((e) =>
      [
        "  <url>",
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const today = new Date().toISOString().slice(0, 10);

const entries: Entry[] = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
];

const products = await fetchProductSlugs();
for (const p of products) {
  entries.push({
    path: `/products/${p.slug}`,
    lastmod: (p.updated_at ?? today).slice(0, 10),
    changefreq: "weekly",
    priority: "0.8",
  });
}

writeFileSync(resolve("public/sitemap.xml"), render(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
