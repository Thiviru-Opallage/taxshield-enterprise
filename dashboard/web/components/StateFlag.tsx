"use client";
import React from "react";

export function StateFlag({ code, className = "h-5 w-7" }: { code: string; className?: string }) {
  const c = code.toUpperCase();

  switch (c) {
    // 1. California: White field, red bottom stripe, red star, grizzly bear silhouette
    case "CA":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#FFFFFF" />
          <rect y="16.5" width="28" height="3.5" fill="#B31942" />
          {/* Red 5-point star */}
          <polygon points="4.5,2.5 5.3,4.5 7.5,4.5 5.8,5.8 6.4,7.8 4.5,6.5 2.6,7.8 3.2,5.8 1.5,4.5 3.7,4.5" fill="#B31942" />
          {/* Bear silhouette representation */}
          <ellipse cx="14" cy="11.5" rx="5.5" ry="3" fill="#6A3B14" />
          <circle cx="10" cy="10" r="1.8" fill="#6A3B14" />
          <circle cx="9.2" cy="9.2" r="0.7" fill="#6A3B14" />
          <rect x="11" y="13.5" width="1.2" height="2" fill="#6A3B14" />
          <rect x="16.5" y="13.5" width="1.2" height="2" fill="#6A3B14" />
        </svg>
      );

    // 2. Texas: Left blue vertical stripe with white star, right top white, bottom red
    case "TX":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="9.3" height="20" fill="#002868" />
          <rect x="9.3" y="0" width="18.7" height="10" fill="#FFFFFF" />
          <rect x="9.3" y="10" width="18.7" height="10" fill="#BF0A30" />
          {/* Lone Star */}
          <polygon points="4.6,5.5 5.3,7.5 7.5,7.5 5.8,8.8 6.4,10.8 4.6,9.5 2.8,10.8 3.4,8.8 1.7,7.5 3.9,7.5" fill="#FFFFFF" />
        </svg>
      );

    // 3. New York: Deep navy field with golden state seal crest
    case "NY":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#14264C" />
          {/* NY State Seal Emblem */}
          <circle cx="14" cy="10" r="5" fill="#D4AF37" />
          <circle cx="14" cy="10" r="4.2" fill="#205493" />
          <path d="M12 11h4l-2-4z" fill="#D4AF37" />
          {/* Eagle atop globe */}
          <circle cx="14" cy="5" r="1.2" fill="#D4AF37" />
          <line x1="12" y1="13" x2="16" y2="13" stroke="#D4AF37" strokeWidth="0.8" />
        </svg>
      );

    // 4. Washington: Deep evergreen field with golden circular George Washington seal
    case "WA":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#005A36" />
          {/* Golden Seal */}
          <circle cx="14" cy="10" r="5.5" fill="#F4B223" />
          <circle cx="14" cy="10" r="4.3" fill="#DCE2DF" />
          {/* Silhouette portrait */}
          <circle cx="13.8" cy="8.5" r="1.6" fill="#1C382B" />
          <path d="M12.5 10.5c0 1.2 1.3 2.5 2.5 2.5s2.5-1.3 2.5-2.5v-0.5h-5z" fill="#1C382B" />
        </svg>
      );

    // 5. Florida: White field with red saltire (X) and center sun seal
    case "FL":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#FFFFFF" />
          {/* Red Saltire Cross */}
          <polygon points="0,0 3,0 28,18 28,20 25,20 0,2" fill="#CC0000" />
          <polygon points="28,0 25,0 0,18 0,20 3,20 28,2" fill="#CC0000" />
          {/* Florida Seal in Center */}
          <circle cx="14" cy="10" r="4.8" fill="#FDB813" />
          <circle cx="14" cy="10" r="4" fill="#004C87" />
          {/* Palm and sun rays */}
          <circle cx="14" cy="8.2" r="1.5" fill="#FDB813" />
          <rect x="13.5" y="9.5" width="1" height="3" fill="#005A36" />
        </svg>
      );

    // 6. Illinois: Clean white field with national eagle and seal
    case "IL":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#FFFFFF" />
          {/* Shield & Eagle emblem */}
          <ellipse cx="14" cy="10" rx="5" ry="4.5" fill="#F4F4F6" stroke="#D1D5DB" strokeWidth="0.5" />
          <circle cx="14" cy="8" r="2" fill="#8B5A2B" />
          <path d="M12 11h4l-2 3z" fill="#B22234" />
          <rect x="13.3" y="11" width="1.4" height="2" fill="#3C3B6E" />
          <path d="M11 6c1 0 2 1 3 1s2-1 3-1" stroke="#BF0A30" strokeWidth="0.7" />
        </svg>
      );

    // 7. Massachusetts: Clean white field with blue/gold coat of arms
    case "MA":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="20" fill="#FFFFFF" />
          {/* Blue Shield with gold border */}
          <path d="M11 6h6v4c0 2.5-3 4-3 4s-3-1.5-3-4z" fill="#002868" stroke="#D4AF37" strokeWidth="0.8" />
          {/* Native American figure / star representation */}
          <circle cx="12.5" cy="8" r="0.6" fill="#FFFFFF" />
          <circle cx="14" cy="9.5" r="1.2" fill="#D4AF37" />
        </svg>
      );

    // 8. Colorado: Blue, white, blue stripes with red "C" and golden disc
    case "CO":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="6.6" fill="#002868" />
          <rect y="6.6" width="28" height="6.8" fill="#FFFFFF" />
          <rect y="13.4" width="28" height="6.6" fill="#002868" />
          {/* Red circular C */}
          <path
            d="M 12 4.5 A 5.5 5.5 0 1 0 12 15.5 L 12 12.5 A 2.5 2.5 0 1 1 12 7.5 Z"
            fill="#C8102E"
          />
          {/* Gold disc inside C */}
          <circle cx="9.5" cy="10" r="2.8" fill="#FFB81C" />
        </svg>
      );

    // 9. Georgia: Three red/white stripes, blue canton with circle of 13 stars
    case "GA":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="28" height="6.6" fill="#BA0C2F" />
          <rect y="6.6" width="28" height="6.8" fill="#FFFFFF" />
          <rect y="13.4" width="28" height="6.6" fill="#BA0C2F" />
          {/* Blue Canton */}
          <rect width="11" height="13.4" fill="#002868" />
          {/* Arch of Constitution and stars */}
          <circle cx="5.5" cy="6.7" r="3.6" stroke="#D4AF37" strokeWidth="0.7" fill="none" />
          <rect x="4.8" y="5.5" width="1.4" height="3" fill="#D4AF37" />
        </svg>
      );

    // 10. North Carolina: Left blue vertical stripe with star and scrolls, top red, bottom white
    case "NC":
      return (
        <svg className={`shrink-0 rounded-[3px] border border-slate-200/80 shadow-2xs ${className}`} viewBox="0 0 28 20" fill="none">
          <rect width="9" height="20" fill="#002868" />
          <rect x="9" y="0" width="19" height="10" fill="#CC0000" />
          <rect x="9" y="10" width="19" height="10" fill="#FFFFFF" />
          {/* White Star flanked by N and C */}
          <circle cx="4.5" cy="10" r="1.5" fill="#FFFFFF" />
          <circle cx="2.5" cy="10" r="0.6" fill="#F4B223" />
          <circle cx="6.5" cy="10" r="0.6" fill="#F4B223" />
        </svg>
      );

    default:
      return (
        <div className={`flex items-center justify-center rounded-[3px] bg-slate-100 font-mono font-bold text-[10px] text-slate-700 border border-slate-200 ${className}`}>
          {code}
        </div>
      );
  }
}
