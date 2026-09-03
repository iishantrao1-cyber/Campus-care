export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "building":
      return (
        <svg {...common}>
          <path d="M4 21V7l8-4 8 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...common}>
          <path d="M8 3v7M6 3v4a2 2 0 0 0 4 0V3M16 3v18M16 3a3 3 0 0 1 3 3v4h-6V6a3 3 0 0 1 3-3z" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-3 3-2-2 3-3z" />
        </svg>
      );
    case "wifi":
      return (
        <svg {...common}>
          <path d="M5 12.5a9 9 0 0 1 14 0" />
          <path d="M8.5 16a5 5 0 0 1 7 0" />
          <path d="M12 20h.01" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <path d="M4 19V5M8 19V8M12 19V5M16 19V8M20 19V5M3 19h18" />
        </svg>
      );
    case "bus":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="12" rx="2" />
          <path d="M4 12h16M8 20h.01M16 20h.01M6 16v4M18 16v4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" />
        </svg>
      );
    case "sport":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c2.5 2.8 4 5.8 4 9s-1.5 6.2-4 9c-2.5-2.8-4-5.8-4-9s1.5-6.2 4-9z" />
          <path d="M3.6 9h16.8M3.6 15h16.8" />
        </svg>
      );
    case "stamp":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="10" rx="1.5" />
          <path d="M8 17h8M7 21h10M9 13v4M15 13v4" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
          <path d="m15 15 5-3-5-3M20 12H10" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
