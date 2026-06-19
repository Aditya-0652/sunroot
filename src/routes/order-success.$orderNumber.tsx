import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-success/$orderNumber")({
  head: () => ({ meta: [{ title: "Order placed · SUNROOT" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderNumber } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
      <CheckCircle2 className="mx-auto h-14 w-14 text-[oklch(0.55_0.13_150)]" strokeWidth={1.5} />
      <h1 className="mt-6 font-serif text-4xl font-semibold text-primary">Thank you!</h1>
      <p className="mt-3 text-muted-foreground">
        We've received your order and your payment details.
      </p>
      <div className="mt-6 inline-block rounded-full border border-[var(--color-gold)]/40 bg-[oklch(0.97_0.04_85/0.4)] px-5 py-2 font-mono text-sm">
        Order #{orderNumber}
      </div>
      <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
        Our team will verify the UPI payment and reach out on your email/phone within 24 hours to
        confirm and arrange dispatch.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Continue shopping
      </Link>
    </div>
  );
}
