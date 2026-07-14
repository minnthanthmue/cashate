import React from "react";

// Types
export interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  id?: string;
}

// Glass Effect Wrapper Component
export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  innerClassName = "",
  style = {},
  onClick,
  id,
}) => {
  const glassStyle: React.CSSProperties = {
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    ...style,
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative overflow-hidden border border-white/40 dark:border-white/12 bg-white/65 dark:bg-slate-950/75 shadow-xl transition-all duration-300 ${className}`}
      style={glassStyle}
    >
      {/* Specular Highlight Gloss Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
      
      {/* Distortion glass distortion layer using SVG Filter */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backdropFilter: "blur(24px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />

      {/* Internal Content */}
      <div className={`relative z-10 w-full h-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};

// SVG Filter Component for Liquid Glass effect (displacement + specular lighting)
export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.002 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="3"
        specularConstant="0.85"
        specularExponent="45"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-150" y="-150" z="250" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="0.8"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="8"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);
