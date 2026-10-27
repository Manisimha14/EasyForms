import React from 'react';

/**
 * PixelLogo: Faithful 8-bit retro pixel art logo for Easy Forms.
 * Exactly matches the chunky orange block with pixelated "EF" typography.
 */
export function PixelLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      aria-label="Easy Forms Pixel Logo"
    >
      {/* Outer Pixelated Squircle Base (Burnt Orange Shadow / Border) */}
      <rect x="4" y="0" width="12" height="20" fill="#D95300" />
      <rect x="2" y="1" width="16" height="18" fill="#D95300" />
      <rect x="1" y="2" width="18" height="16" fill="#D95300" />
      <rect x="0" y="4" width="20" height="12" fill="#D95300" />

      {/* Main Orange Body */}
      <rect x="4" y="1" width="12" height="17" fill="#FF7300" />
      <rect x="2" y="2" width="16" height="15" fill="#FF7300" />
      <rect x="1" y="3" width="18" height="13" fill="#FF7300" />
      <rect x="1" y="4" width="17" height="11" fill="#FF7300" />

      {/* Top-Left Soft Highlight Accent */}
      <rect x="4" y="2" width="5" height="2" fill="#FFA547" />
      <rect x="2" y="4" width="2" height="5" fill="#FFA547" />
      <rect x="3" y="3" width="2" height="2" fill="#FFA547" />

      {/* --- Letter 'E' (Pure White Pixel Blocks) --- */}
      {/* Main Vertical Stem */}
      <rect x="4" y="7" width="3" height="7" fill="#FFFFFF" />
      {/* Top Arm with Pixel Chamfer */}
      <rect x="5" y="6" width="5" height="2" fill="#FFFFFF" />
      <rect x="4" y="7" width="6" height="1" fill="#FFFFFF" />
      {/* Middle Arm */}
      <rect x="4" y="9" width="5" height="2" fill="#FFFFFF" />
      {/* Bottom Arm */}
      <rect x="4" y="12" width="6" height="2" fill="#FFFFFF" />
      <rect x="5" y="13" width="5" height="1" fill="#FFFFFF" />

      {/* --- Letter 'F' (Pure White Pixel Blocks) --- */}
      {/* Main Vertical Stem */}
      <rect x="11" y="7" width="3" height="7" fill="#FFFFFF" />
      {/* Top Arm with Pixel Chamfer */}
      <rect x="12" y="6" width="5" height="2" fill="#FFFFFF" />
      <rect x="11" y="7" width="6" height="1" fill="#FFFFFF" />
      {/* Middle Arm */}
      <rect x="11" y="9" width="5" height="2" fill="#FFFFFF" />
    </svg>
  );
}

export default PixelLogo;
