import { cn } from "@/lib/utils";

interface WaveBackgroundProps {
  className?: string;
}

const WaveBackground = ({ className }: WaveBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden -z-10 pointer-events-none", className)}>
      {/* Top waves */}
      <div className="absolute top-0 left-0 right-0 h-64 opacity-5">
        <div className="absolute top-0 left-0 right-0 h-32 bg-blue-400/50 rounded-b-[100%]"></div>
        <div className="absolute top-10 left-0 right-0 h-32 bg-violet-500/50 rounded-b-[100%] animate-[wave_12s_ease-in-out_infinite]"></div>
        <div className="absolute top-20 left-0 right-0 h-32 bg-blue-500/50 rounded-b-[100%] animate-[wave_15s_ease-in-out_infinite_reverse]"></div>
      </div>
      
      {/* Bottom waves */}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-5">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-violet-400/50 rounded-t-[100%]"></div>
        <div className="absolute bottom-10 left-0 right-0 h-32 bg-blue-500/50 rounded-t-[100%] animate-[wave_10s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 left-0 right-0 h-32 bg-violet-500/50 rounded-t-[100%] animate-[wave_14s_ease-in-out_infinite_reverse]"></div>
      </div>
    </div>
  );
};

export default WaveBackground;
