/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  // Dimension and padding mappings based on the size parameter
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const containerSize = sizeClasses[size];

  return (
    <div 
      className={`flex items-center justify-center select-none ${containerSize} ${className}`} 
      id="cash-ate-logo-container"
    >
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
        id="cash-ate-logo-svg"
      >
        {/* Gradients and Filters Definition */}
        <defs>
          {/* Main squircle background gradient (Ice Blue, Light Lavender, Soft Pink) */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAF7FF" />
            <stop offset="50%" stopColor="#F2EAFF" />
            <stop offset="100%" stopColor="#FFEBF2" />
          </linearGradient>

          {/* Bitten coin gradient (Lavender to Soft Indigo) */}
          <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBB8FF" />
            <stop offset="35%" stopColor="#7FA9FF" />
            <stop offset="70%" stopColor="#9C7CFF" />
            <stop offset="100%" stopColor="#8A7DFF" />
          </linearGradient>

          {/* Soft ambient drop shadow for the coin itself */}
          <filter id="coinShadow" x="-20%" y="-15%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8A7DFF" floodOpacity="0.3" />
          </filter>

          {/* Clean drop shadow for the glassmorphic dollar symbol */}
          <filter id="symbolShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#8A7DFF" floodOpacity="0.4" />
          </filter>

          {/* Mask to cut out beautiful bitten scallops from the coin */}
          <mask id="coinBiteMask">
            {/* White represents areas we keep (the full coin) */}
            <rect x="0" y="0" width="128" height="128" fill="white" />
            {/* Black circles cut out the bite scallops from the upper right of the coin */}
            <circle cx="88" cy="28" r="14" fill="black" />
            <circle cx="104" cy="46" r="10" fill="black" />
          </mask>
        </defs>

        {/* 1. Outer App Icon Squircle */}
        <rect 
          x="4" 
          y="4" 
          width="120" 
          height="120" 
          rx="32" 
          ry="32" 
          fill="url(#bgGradient)" 
          id="logo-squircle-bg"
        />

        {/* 2. Soft inner white rim/highlight to mimic depth */}
        <rect 
          x="4.75" 
          y="4.75" 
          width="118.5" 
          height="118.5" 
          rx="31.25" 
          ry="31.25" 
          fill="none" 
          stroke="white" 
          strokeWidth="1.5" 
          opacity="0.55" 
          id="logo-squircle-rim"
        />

        {/* 3. The Bitten Coin/Cookie with its Gradient and Mask */}
        <g filter="url(#coinShadow)" id="logo-bitten-coin-group">
          <circle 
            cx="64" 
            cy="64" 
            r="36" 
            fill="url(#coinGradient)" 
            mask="url(#coinBiteMask)" 
            id="logo-bitten-coin"
          />
        </g>

        {/* 4. Elegant Glassmorphic Dollar Symbol on top */}
        <g id="logo-dollar-symbol-group" filter="url(#symbolShadow)">
          {/* Top small vertical stroke */}
          <line 
            x1="64" 
            y1="37" 
            x2="64" 
            y2="45" 
            stroke="white" 
            strokeWidth="7.5" 
            strokeLinecap="round" 
            opacity="0.94" 
          />
          {/* Bottom small vertical stroke */}
          <line 
            x1="64" 
            y1="83" 
            x2="64" 
            y2="91" 
            stroke="white" 
            strokeWidth="7.5" 
            strokeLinecap="round" 
            opacity="0.94" 
          />
          {/* Thick, beautifully curved "S" curve */}
          <path 
            d="M 73.5,50.5 C 73.5,44.5 69.5,42 64,42 C 58,42 55,45.5 55,51 C 55,58.5 73,59.5 73,67.5 C 73,73.5 69,76.5 64,76.5 C 58,76.5 55,73 55,67" 
            stroke="white" 
            strokeWidth="7.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.94" 
            id="logo-dollar-s-curve"
          />
        </g>
      </svg>
    </div>
  );
}
