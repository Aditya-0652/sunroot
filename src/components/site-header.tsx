import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/logo";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-[var(--color-brand-orange)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src={logoAsset}
            alt="Sunroot logo"
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/40"
          />
          <div className="min-w-0 leading-tight">
            <div className="font-serif text-2xl font-bold tracking-wide">
              <span style={{ color: "var(--color-brand-yellow)" }}>SUN</span>
              <span style={{ color: "var(--color-brand-brown)" }}>ROOT</span>
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.18em] text-white sm:block">
              Rooted in love. Made to shine
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-white md:flex">
          <Link to="/" className="hover:text-[var(--color-brand-yellow)] transition-colors">
            Shop
          </Link>
          <a href="/#story" className="hover:text-[var(--color-brand-yellow)] transition-colors">
            Story
          </a>
          <a href="/#order-status" className="hover:text-[var(--color-brand-yellow)] transition-colors">
            Track order
          </a>
          <a href="/#contact" className="hover:text-[var(--color-brand-yellow)] transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out"
              className="text-white hover:bg-white/15 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative text-white hover:bg-white/15 hover:text-white"
          >
            <Link to="/cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-brand-yellow)] px-1 text-[10px] font-bold text-[var(--color-brand-brown)]">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
