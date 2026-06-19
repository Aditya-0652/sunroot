import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/hooks/use-cart";
import { inr } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart · SUNROOT" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Browse the collection and add a little something.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-4xl font-semibold text-primary">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((it) => (
            <li
              key={it.productId}
              className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4"
            >
              <Link
                to="/products/$slug"
                params={{ slug: it.slug }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[oklch(0.95_0.02_230)]"
              >
                {it.image ? (
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center font-serif text-muted-foreground">
                    S
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to="/products/$slug"
                      params={{ slug: it.slug }}
                      className="font-serif text-lg font-semibold text-primary hover:underline"
                    >
                      {it.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{inr(it.price)} each</p>
                  </div>
                  <button
                    onClick={() => remove(it.productId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty(it.productId, it.quantity - 1)}
                      className="grid h-8 w-8 place-items-center"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-medium">{it.quantity}</span>
                    <button
                      onClick={() => setQty(it.productId, it.quantity + 1)}
                      className="grid h-8 w-8 place-items-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold">{inr(it.price * it.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-serif text-xl font-semibold text-primary">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-xs text-muted-foreground">Calculated at checkout</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link to="/checkout">Checkout</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prepaid UPI · Free shipping over ₹499
          </p>
        </aside>
      </div>
    </div>
  );
}
