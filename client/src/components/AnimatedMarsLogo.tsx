import React from "react";

export function AnimatedMarsLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-spin"
        style={{ animationDuration: "8s" }}
      >
        {/* Mars planet base */}
        <defs>
          <radialGradient id="marsGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="50%" stopColor="#d63031" />
            <stop offset="100%" stopColor="#2d3436" />
          </radialGradient>
          <radialGradient id="glowGradient" cx="0.5" cy="0.5">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#ff6b35" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Outer glow */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#glowGradient)"
          className="animate-pulse"
        />
        
        {/* Mars planet */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="url(#marsGradient)"
          stroke="#ff6b35"
          strokeWidth="1"
          opacity="0.9"
        />
        
        {/* Surface features - craters and patterns */}
        <circle cx="35" cy="40" r="3" fill="#a0522d" opacity="0.6" />
        <circle cx="60" cy="35" r="2" fill="#8b4513" opacity="0.5" />
        <circle cx="45" cy="60" r="4" fill="#a0522d" opacity="0.4" />
        <circle cx="65" cy="55" r="2.5" fill="#8b4513" opacity="0.5" />
        
        {/* Polar ice cap */}
        <ellipse cx="50" cy="25" rx="8" ry="4" fill="#e3f2fd" opacity="0.7" />
        
        {/* Atmosphere shimmer */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="#ff6b35"
          strokeWidth="0.5"
          opacity="0.3"
          className="animate-pulse"
        />
        
        {/* Orbital rings/satellites */}
        <g className="animate-spin" style={{ animationDuration: "12s", transformOrigin: "50px 50px" }}>
          <circle cx="75" cy="50" r="1.5" fill="#74b9ff" className="animate-pulse" />
          <circle cx="25" cy="50" r="1" fill="#a29bfe" className="animate-pulse" />
        </g>
      </svg>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-1 h-1 bg-orange-400 rounded-full animate-ping"
          style={{ 
            top: "20%", 
            left: "80%", 
            animationDelay: "0s",
            animationDuration: "3s" 
          }}
        />
        <div 
          className="absolute w-0.5 h-0.5 bg-red-400 rounded-full animate-ping"
          style={{ 
            top: "70%", 
            left: "15%", 
            animationDelay: "1s",
            animationDuration: "2s" 
          }}
        />
        <div 
          className="absolute w-0.5 h-0.5 bg-yellow-400 rounded-full animate-ping"
          style={{ 
            top: "40%", 
            left: "90%", 
            animationDelay: "2s",
            animationDuration: "4s" 
          }}
        />
      </div>
    </div>
  );
}