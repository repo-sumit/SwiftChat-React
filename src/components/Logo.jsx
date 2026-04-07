import React from 'react'

/**
 * SwiftChat logo — extracted from Figma brand.
 * Uses the primary #386AF6 blue with a stylised swift-bird / shield mark.
 */
export default function Logo({ size = 36, showText = false, textColor = '#1A1F36' }) {
  return (
    <div className="flex items-center gap-2">
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SwiftChat logo"
      >
        {/* Shield body */}
        <path
          d="M18 3L5 8.5V17C5 24.5 10.8 31.4 18 33C25.2 31.4 31 24.5 31 17V8.5L18 3Z"
          fill="#386AF6"
        />
        {/* Inner shield highlight */}
        <path
          d="M18 6.5L8 11V17C8 23 12.8 28.6 18 30C23.2 28.6 28 23 28 17V11L18 6.5Z"
          fill="url(#logo-inner)"
        />
        {/* Checkmark */}
        <path
          d="M12 17.5L16 21.5L24 13.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Swift bird wing accent */}
        <path
          d="M22 10C24 9 27 9.5 28 11"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="logo-inner" x1="18" y1="6.5" x2="18" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B85F8" />
            <stop offset="1" stopColor="#1E4FD8" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: size * 0.56, color: textColor, fontFamily: 'Montserrat, sans-serif' }}
        >
          Swift<span style={{ color: '#386AF6' }}>Chat</span>
        </span>
      )}
    </div>
  )
}
