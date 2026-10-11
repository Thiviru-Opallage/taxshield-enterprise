"use client";
import React from "react";

export function TaxShieldLogo({
  className = "h-8 w-8",
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Shield Primary Gradient */}
        <linearGradient id="ts-shield-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Left Facet Gradient */}
        <linearGradient id="ts-left-facet" x1="6" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Right Facet Gradient */}
        <linearGradient id="ts-right-facet" x1="20" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        {/* Core Emerald Cryptographic Node Gradient */}
        <linearGradient id="ts-core-node" x1="16" y1="12" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="ts-glow" x="12" y="10" width="16" height="16" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Outer Geometric Shield Structure */}
      {/* Left Shield Wing */}
      <path
        d="M20 3.5L8.5 7.8C7.6 8.1 7 8.9 7 9.8V19.2C7 26.8 12.6 33.7 20 36.5V3.5Z"
        fill="url(#ts-left-facet)"
      />

      {/* Right Shield Wing */}
      <path
        d="M20 3.5L31.5 7.8C32.4 8.1 33 8.9 33 9.8V19.2C33 26.8 27.4 33.7 20 36.5V3.5Z"
        fill="url(#ts-right-facet)"
      />

      {/* 2. Stylized Monogram "T" & Cryptographic Hash Core */}
      {/* Horizontal Crossbar of "T" */}
      <path
        d="M12 11.5C12 10.7 12.7 10 13.5 10H26.5C27.3 10 28 10.7 28 11.5C28 12.3 27.3 13 26.5 13H13.5C12.7 13 12 12.3 12 11.5Z"
        fill="#FFFFFF"
      />

      {/* Vertical Stem of "T" intersecting into Ledger Chain Arrow */}
      <path
        d="M18.2 13H21.8V23.5L20 25.5L18.2 23.5V13Z"
        fill="#FFFFFF"
      />

      {/* 3. Central Cryptographic Diamond Prism (SHA-256 Block Symbol) */}
      <polygon
        points="20,13.8 23.8,17.6 20,21.4 16.2,17.6"
        fill="url(#ts-core-node)"
      />

      {/* Central Core Light Specular Point */}
      <circle
        cx="20"
        cy="17.6"
        r="1.4"
        fill="#FFFFFF"
      />

      {/* Subtle Bottom Integrity Notch */}
      <circle
        cx="20"
        cy="30"
        r="1.2"
        fill="#38BDF8"
        opacity="0.8"
      />
    </svg>
  );
}

export function TaxShieldBrandMark({
  subtitle = "Telemetry, quietly verified.",
}: {
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_3px_12px_rgba(2,132,199,0.12)] border border-slate-100 transition-transform group-hover:scale-105">
        <TaxShieldLogo className="h-6 w-6" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
            TaxShield
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
