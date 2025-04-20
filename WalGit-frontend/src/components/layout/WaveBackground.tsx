import { cn } from "@/lib/utils";

interface WaveBackgroundProps {
  className?: string;
}

const WaveBackground = ({ className }: WaveBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden -z-10 pointer-events-none", className)}>
      {/* Top waves */}
      <div className="absolute top-0 left-0 right-0 h-64 opacity-5">
        <div className="absolute top-0 left-0 right-0 h-32 bg-ocean-400 rounded-b-[100%]"></div>
        <div className="absolute top-10 left-0 right-0 h-32 bg-ocean-500 rounded-b-[100%] animate-[wave_12s_ease-in-out_infinite]"></div>
        <div className="absolute top-20 left-0 right-0 h-32 bg-sui-400 rounded-b-[100%] animate-[wave_15s_ease-in-out_infinite_reverse]"></div>
      </div>
      
      {/* Bottom waves */}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-5">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-ocean-400 rounded-t-[100%]"></div>
        <div className="absolute bottom-10 left-0 right-0 h-32 bg-ocean-500 rounded-t-[100%] animate-[wave_10s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 left-0 right-0 h-32 bg-sui-400 rounded-t-[100%] animate-[wave_14s_ease-in-out_infinite_reverse]"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-ocean-200 opacity-30 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-sui-300 opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/3 left-1/3 w-5 h-5 rounded-full bg-ocean-300 opacity-25 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-6 h-6 rounded-full bg-sui-200 opacity-15 animate-pulse"></div>
    </div>
  );
};

export default WaveBackground;
