import logoAsset from "@/assets/logo";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="mt-24 border-t border-border/60 bg-[var(--color-brand-orange)]/10"
    >
      <section
        id="order-status"
        className="border-b border-border/60 bg-[var(--color-brand-yellow)]/10"
      >
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <OrderStatusLookup />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={logoAsset}
              alt="SUNROOT"
              className="h-10 w-10 rounded-full object-cover"
            />
            <h3 className="font-serif text-2xl font-bold">
              <span style={{ color: "var(--color-brand-yellow)" }}>SUN</span>
              <span style={{ color: "var(--color-brand-brown)" }}>ROOT</span>
            </h3>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Thoughtfully designed learning products that grow with curious little minds.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/" className="hover:text-[var(--color-brand-orange)]">All products</a>
            </li>
            <li>
              <a href="/cart" className="hover:text-[var(--color-brand-orange)]">Cart</a>
            </li>
            <li>
              <a href="#order-status" className="hover:text-[var(--color-brand-orange)]">
                Track order
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Prepaid UPI orders only</li>
            <li>Ships across India</li>
            <li>Free shipping over ₹499</li>
            <li>
              Contact us:{" "}
              <a
                href="mailto:sunroot4u@gmail.com"
                className="text-[var(--color-brand-orange)] hover:underline"
              >
                sunroot4u@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center">
        <a
          href="/auth"
          className="text-xs text-muted-foreground hover:text-[var(--color-brand-orange)]"
        >
          Admin login
        </a>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SUNROOT. Made with care.
      </div>
    </footer>
  );
}
