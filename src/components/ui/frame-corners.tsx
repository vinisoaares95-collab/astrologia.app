import { cn } from "@/lib/cn";

/** Cantoneiras de enquadramento, como em um visor de câmera. */
export function FrameCorners({ className }: { className?: string }) {
  const corner = "absolute size-6 border-accent";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-3", className)}
    >
      <span
        className={cn(
          corner,
          "top-0 left-0 rounded-tl-xl border-t-2 border-l-2",
        )}
      />
      <span
        className={cn(
          corner,
          "top-0 right-0 rounded-tr-xl border-t-2 border-r-2",
        )}
      />
      <span
        className={cn(
          corner,
          "bottom-0 left-0 rounded-bl-xl border-b-2 border-l-2",
        )}
      />
      <span
        className={cn(
          corner,
          "right-0 bottom-0 rounded-br-xl border-r-2 border-b-2",
        )}
      />
    </div>
  );
}
