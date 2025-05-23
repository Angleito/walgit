import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ariaAttributes } from "@/lib/accessibility"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Enhanced Cyberpunk variants with more angular styling and effects
        cyber: `bg-black border-[1px] border-cyan-500 text-cyan-400 relative
               after:absolute after:content-[''] after:w-full after:h-[2px] after:bg-cyan-500/70 after:bottom-0 after:left-0 after:scale-x-0 after:origin-right after:transition-transform after:duration-300
               hover:after:scale-x-100 hover:after:origin-left
               before:absolute before:content-[''] before:inset-0 before:bg-cyan-500/0 before:hover:bg-cyan-500/10 before:transition-all
               shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:shadow-[0_0_25px_rgba(0,255,255,0.8)]
               transform hover:-translate-y-[2px] transition-all duration-300
               cyber-clip`,
        
        cyberRed: `bg-black border-[1px] border-red-500 text-red-400 relative
                  after:absolute after:content-[''] after:w-full after:h-[2px] after:bg-red-500/70 after:bottom-0 after:left-0 after:scale-x-0 after:origin-right after:transition-transform after:duration-300
                  hover:after:scale-x-100 hover:after:origin-left
                  before:absolute before:content-[''] before:inset-0 before:bg-red-500/0 before:hover:bg-red-500/10 before:transition-all
                  shadow-[0_0_10px_rgba(255,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,0,0,0.8)]
                  transform hover:-translate-y-[2px] transition-all duration-300
                  cyber-clip`,
        
        cyberPurple: `bg-black border-[1px] border-purple-500 text-purple-400 relative
                     after:absolute after:content-[''] after:w-full after:h-[2px] after:bg-purple-500/70 after:bottom-0 after:left-0 after:scale-x-0 after:origin-right after:transition-transform after:duration-300
                     hover:after:scale-x-100 hover:after:origin-left
                     before:absolute before:content-[''] before:inset-0 before:bg-purple-500/0 before:hover:bg-purple-500/10 before:transition-all
                     shadow-[0_0_10px_rgba(147,51,234,0.5)] hover:shadow-[0_0_25px_rgba(147,51,234,0.8)]
                     transform hover:-translate-y-[2px] transition-all duration-300
                     cyber-clip`,
        
        cyberGreen: `bg-black border-[1px] border-green-500 text-green-400 relative
                    after:absolute after:content-[''] after:w-full after:h-[2px] after:bg-green-500/70 after:bottom-0 after:left-0 after:scale-x-0 after:origin-right after:transition-transform after:duration-300
                    hover:after:scale-x-100 hover:after:origin-left
                    before:absolute before:content-[''] before:inset-0 before:bg-green-500/0 before:hover:bg-green-500/10 before:transition-all
                    shadow-[0_0_10px_rgba(0,255,0,0.5)] hover:shadow-[0_0_25px_rgba(0,255,0,0.8)]
                    transform hover:-translate-y-[2px] transition-all duration-300
                    cyber-clip`,
        
        cyberYellow: `bg-black border-[1px] border-yellow-500 text-yellow-400 relative
                     after:absolute after:content-[''] after:w-full after:h-[2px] after:bg-yellow-500/70 after:bottom-0 after:left-0 after:scale-x-0 after:origin-right after:transition-transform after:duration-300
                     hover:after:scale-x-100 hover:after:origin-left
                     before:absolute before:content-[''] before:inset-0 before:bg-yellow-500/0 before:hover:bg-yellow-500/10 before:transition-all
                     shadow-[0_0_10px_rgba(255,255,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,0,0.8)]
                     transform hover:-translate-y-[2px] transition-all duration-300
                     cyber-clip`,
        
        cyberFlat: `bg-zinc-900 text-white relative
                   before:absolute before:content-[''] before:inset-0 before:hover:bg-zinc-800 before:transition-all
                   transform hover:-translate-y-[2px] transition-all duration-300
                   border-l-2 border-r-2 border-t-0 border-b-0 border-l-cyan-500 border-r-purple-500
                   after:absolute after:content-[''] after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-cyan-500 after:to-purple-500 
                   after:bottom-0 after:left-0 after:transition-all after:duration-500
                   hover:after:w-full
                   cyber-clip`,
                   
        // New variant - Angular cyber with animated borders
        cyberAngular: `bg-black border-0 text-cyan-400 relative
                      before:absolute before:content-[''] before:w-[calc(100%-10px)] before:h-[calc(100%-10px)] 
                      before:border before:border-cyan-500 before:top-[5px] before:left-[5px]
                      after:absolute after:content-[''] after:w-0 after:h-0 
                      after:border-t-[2px] after:border-r-[2px] after:border-t-cyan-500 after:border-r-cyan-500
                      after:top-0 after:right-0 after:transition-all after:duration-300
                      hover:after:w-[20px] hover:after:h-[20px]
                      [&>span]:before:absolute [&>span]:before:content-[''] [&>span]:before:w-0 [&>span]:before:h-0 
                      [&>span]:before:border-b-[2px] [&>span]:before:border-l-[2px] [&>span]:before:border-b-cyan-500 [&>span]:before:border-l-cyan-500
                      [&>span]:before:bottom-0 [&>span]:before:left-0 [&>span]:before:transition-all [&>span]:before:duration-300
                      hover:[&>span]:before:w-[20px] hover:[&>span]:before:h-[20px]
                      shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]
                      transform hover:-translate-y-[2px] transition-all duration-300`,
                      
        // New variant - Pulse Cyber with energy pulse effect on hover
        cyberPulse: `bg-black border-[1px] border-cyan-500 text-cyan-400 relative cyber-clip
                    before:absolute before:content-[''] before:inset-0 before:bg-cyan-500/0 before:transition-all
                    hover:before:bg-[radial-gradient(circle,rgba(5,217,232,0.2)_0%,rgba(0,0,0,0)_70%)]
                    hover:before:animate-[pulse_2s_ease-in-out_infinite]
                    shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:shadow-[0_0_25px_rgba(0,255,255,0.7)]
                    transform hover:-translate-y-[2px] hover:scale-[1.02] transition-all duration-300`,

        // Wallet Connect Cyber Button with energetic cyberpunk style
        // Enhanced version with more intense cyberpunk styling
        cyberpunk: `relative bg-gradient-to-tr from-black via-cyan-950 to-black font-orbitron
                   border-[1.5px] border-[#0ff] text-[#0ff] relative 
                   overflow-hidden z-10
                   before:absolute before:content-[''] before:inset-0
                   before:bg-gradient-to-r before:from-cyan-500/0 before:via-cyan-500/30 before:to-cyan-500/0
                   before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300
                   after:absolute after:content-[''] after:bottom-0 after:left-0 after:w-full after:h-[2px]
                   after:bg-gradient-to-r after:from-[#0ff] after:via-[#f0f] after:to-[#0ff]
                   after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-500
                   shadow-[0_0_15px_rgba(0,255,255,0.5)] hover:shadow-[0_0_25px_rgba(0,255,255,0.8)]
                   transform hover:-translate-y-[2px] hover:text-white transition-all duration-300
                   text-shadow-[0_0_8px_rgba(0,255,255,0.7)]`,
                   
        // Neon magenta variant
        cyberNeon: `relative bg-black font-orbitron
                  border-[1.5px] border-[#f0f] text-[#f0f] relative 
                  overflow-hidden z-10 rounded-sm
                  before:absolute before:content-[''] before:inset-0
                  before:bg-gradient-to-r before:from-[#f0f]/0 before:via-[#f0f]/30 before:to-[#f0f]/0
                  before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300
                  after:absolute after:content-[''] after:left-0 after:right-0 after:h-[1.5px] 
                  after:bg-[#f0f] after:glow-[#f0f]
                  after:bottom-0 after:scale-x-0 hover:after:scale-x-100 
                  after:transition-transform after:duration-500
                  shadow-[0_0_8px_rgba(255,0,255,0.5)] hover:shadow-[0_0_20px_rgba(255,0,255,0.8)]
                  text-shadow-[0_0_8px_rgba(255,0,255,0.7)]
                  transform hover:-translate-y-[1px] transition-all duration-300`,
                  
        // Hacker style terminal theme
        cyberHacker: `relative bg-black font-mono
                    border-l-[2px] border-r-[2px] border-[#0f0] text-[#0f0] relative 
                    overflow-hidden z-10 rounded-none
                    before:absolute before:content-[''] before:inset-0
                    before:bg-[#0f0]/5 
                    before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-200
                    after:absolute after:content-[''] after:top-0 after:bottom-0 after:w-[1px] after:h-full
                    after:left-[-1px] after:bg-[#0f0] after:shadow-[0_0_8px_rgba(0,255,0,0.8)]
                    hover:bg-[#0f0]/10
                    shadow-none hover:shadow-[0_0_15px_rgba(0,255,0,0.3)]
                    transform hover:scale-[1.02] transition-all duration-200
                    text-shadow-[0_0_5px_rgba(0,255,0,0.7)]`,
                    
        // Glitchy digital circuit button
        cyberGlitch: `relative bg-[#000] font-orbitron
                    border border-[#0ff]/80 text-[#0ff] relative 
                    overflow-hidden z-10 rounded-sm
                    before:absolute before:content-[''] before:inset-0
                    before:bg-gradient-to-tr before:from-transparent before:via-[#0ff]/10 before:to-transparent
                    before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300
                    hover:animate-glitch-effect
                    shadow-[0_0_4px_rgba(0,255,255,0.3),inset_0_0_2px_rgba(0,255,255,0.5)] 
                    hover:shadow-[0_0_10px_rgba(0,255,255,0.6),inset_0_0_4px_rgba(0,255,255,0.8)]
                    transform hover:scale-[1.02] hover:tracking-wider transition-all duration-300
                    text-shadow-[0_0_3px_rgba(0,255,255,0.7)]`,
                    
        // Holographic button
        cyberHolo: `relative bg-gradient-to-tr from-indigo-900/30 via-cyan-900/20 to-purple-900/30 backdrop-blur-md
                  border border-white/20 text-white/90 relative 
                  overflow-hidden z-10 rounded-md
                  before:absolute before:content-[''] before:inset-0
                  before:bg-gradient-to-r before:from-[#0ff]/0 before:via-[#0ff]/20 before:to-[#f0f]/0
                  before:opacity-30 hover:before:opacity-50 
                  before:animate-gradient-x before:transition-all before:duration-300
                  shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]
                  transform hover:-translate-y-[2px] transition-all duration-300
                  text-shadow-[0_0_5px_rgba(255,255,255,0.5)]`,
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        // New size variants
        xl: "h-12 px-10 py-3 text-base",
        xxl: "h-14 px-12 py-4 text-lg",
      },
      animation: {
        none: "",
        pulse: "animate-pulse-subtle",
        blink: "animate-border-blink",
        glitch: "animate-glitch-text",
        // Enhanced cyberpunk animation variants
        energyPulse: "animate-energy-pulse",
        flicker: "animate-flicker",
        neonBreathe: "animate-neon-breathe",
        scanline: "animate-scanline",
        dataFlow: "animate-data-flow",
        glitchText: "animate-glitch-text",
        hacking: "animate-typing",
        hologram: "animate-hologram-flicker"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * @deprecated - Not needed anymore
   */
  asChild?: boolean;

  /**
   * @deprecated - Not needed anymore
   */
  aschild?: boolean;
  /**
   * Whether the button is in a pressed/toggled state
   */
  isPressed?: boolean;

  /**
   * Whether the button is currently in a loading state
   */
  isLoading?: boolean;

  /**
   * Content to display when the button is in loading state
   */
  loadingText?: string;

  /**
   * Icon to show in the loading state
   */
  loadingIcon?: React.ReactNode;

  /**
   * Apply the glowing neon text effect
   */
  glowText?: boolean;

  /**
   * Apply a glitch effect on hover
   */
  glitchHover?: boolean;
  
  /**
   * Add energy lines that flow through the button
   */
  energyLines?: boolean;
  
  /**
   * Apply an extra bright pulsing effect on hover
   */
  pulseOnHover?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    isPressed,
    isLoading,
    loadingText,
    loadingIcon,
    children,
    disabled,
    glowText,
    glitchHover,
    energyLines,
    pulseOnHover,
    ...props
  }, ref) => {
    // Handle keyboard interactions
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Trigger click on Space keydown for div/span buttons with role="button"
      if (e.key === " " && props.role === "button") {
        e.preventDefault();
        e.currentTarget.click();
      }

      // Call any existing keyDown handler
      props.onKeyDown?.(e);
    };

    // Combine disabled state with loading state
    const isDisabled = disabled || isLoading;

    // Generate ARIA attributes based on button state
    const pressedAttributes = isPressed !== undefined ? ariaAttributes.toggle(isPressed) : {};
    const loadingAttributes = isLoading ? ariaAttributes.loading(true) : {};

    // If it has loading text, it should notify screen readers of the state change
    const ariaProps = {
      ...pressedAttributes,
      ...loadingAttributes,
      ...(loadingText && isLoading ? { 'aria-label': loadingText } : {})
    };

    // Determine if this is a cyberpunk variant
    const isCyberpunk =
      variant === 'cyber' ||
      variant === 'cyberRed' ||
      variant === 'cyberPurple' ||
      variant === 'cyberGreen' ||
      variant === 'cyberYellow' ||
      variant === 'cyberFlat' ||
      variant === 'cyberAngular' ||
      variant === 'cyberPulse' ||
      variant === 'cyberpunk' ||
      variant === 'cyberNeon' ||
      variant === 'cyberHacker' ||
      variant === 'cyberGlitch' ||
      variant === 'cyberHolo';
      
    // Determine color for energy lines
    const energyLineColor = 
      variant === 'cyberRed' ? 'bg-red-500' : 
      variant === 'cyberPurple' ? 'bg-purple-500' : 
      variant === 'cyberGreen' ? 'bg-green-500' : 
      variant === 'cyberYellow' ? 'bg-yellow-500' : 
      'bg-cyan-500';

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          glowText && "text-shadow-glow",
          glitchHover && "hover:animate-glitch-effect",
          pulseOnHover && "hover:animate-pulse-strong",
          isCyberpunk && "cyber-button", // Base class for all cyberpunk button styles
        )}
        ref={ref}
        disabled={isDisabled}
        onKeyDown={handleKeyDown}
        data-cyberpunk={isCyberpunk ? "true" : undefined}
        {...ariaProps}
        {...props}
      >
        {isCyberpunk && <span className="cyber-button-glitch absolute inset-0 opacity-0 hover:opacity-30 bg-white mix-blend-overlay transition-opacity duration-100 z-0"></span>}
        
        {/* Energy lines for enhanced visual effect */}
        {isCyberpunk && energyLines && (
          <>
            <span className={`absolute h-[1px] w-0 ${energyLineColor} top-[30%] left-0 hover:w-full transition-all duration-700 delay-100 opacity-70`}></span>
            <span className={`absolute h-[1px] w-0 ${energyLineColor} top-[70%] right-0 hover:w-full transition-all duration-700 delay-200 opacity-70`}></span>
            <span className={`absolute w-[1px] h-0 ${energyLineColor} left-[30%] top-0 hover:h-full transition-all duration-700 delay-300 opacity-70`}></span>
            <span className={`absolute w-[1px] h-0 ${energyLineColor} right-[30%] bottom-0 hover:h-full transition-all duration-700 delay-150 opacity-70`}></span>
          </>
        )}
        
        <span className="relative z-10 inline-flex items-center justify-center">
          {isLoading ? (
            <>
              {loadingIcon || (
                <span className="loading-indicator mr-2">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              )}
              {loadingText || children}
            </>
          ) : (
            children
          )}
        </span>
        
        {isCyberpunk && (
          <span className="cyber-button-shine absolute inset-0 overflow-hidden z-0">
            <span className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-[20deg] hover:animate-shine"></span>
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }