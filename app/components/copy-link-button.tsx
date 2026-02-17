import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { toast } from "sonner";

type Props = {
  to: string;
  children?: React.ReactNode;
  className?: string;
};

export default function CopyLinkButton({ to, children, className }: Props) {
  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Only intercept left click without modifiers
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return; // allow default behavior (open in new tab, etc.)
    }

    e.preventDefault();

    const url =
      typeof window !== "undefined" ? `${window.location.origin}${to}` : to;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        className,
      )}
    >
      {children ?? "Link de reserva"}
    </Link>
  );
}
