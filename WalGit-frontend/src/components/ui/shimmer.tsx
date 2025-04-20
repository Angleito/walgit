
import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn("relative overflow-hidden group", className)}>
      {/* Ocean wave shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 bg-gradient-to-r from-transparent via-ocean-100/20 to-transparent z-10 pointer-events-none"></div>
      {children}
    </div>
  );
}
