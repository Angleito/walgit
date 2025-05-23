import { cn } from "@/lib/utils";

interface WaveBackgroundProps {
  className?: string;
}

const WaveBackground = ({ className }: WaveBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden -z-10 pointer-events-none", className)}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black/90"></div>
      
      {/* Animated waves */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-blue-500/20 animate-[wave_20s_linear_infinite]"></div>
        </div>
        <div className="absolute inset-0 opacity-20 rotate-180">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-blue-500/20 animate-[wave_15s_linear_infinite_reverse]"></div>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-400/30 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-violet-400/30 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-blue-400/30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-violet-400/30 animate-pulse"></div>
      </div>
    </div>
  );
};

export default WaveBackground;
