type IconName =
  | "establish"
  | "grow"
  | "transform"
  | "audit"
  | "accounting"
  | "advisory"
  | "tax"
  | "legal"
  | "digital"
  | "people"
  | "globe"
  | "pin";

export function Icon({ name }: { name: IconName }) {
  switch (name) {
    case "establish":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h16" />
          <path d="M6 20V10l6-5 6 5v10" />
          <path d="M12 5v3" />
          <path d="M10 8h4" />
        </svg>
      );
    case "grow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h16" />
          <path d="M7 16v-4" />
          <path d="M12 16V8" />
          <path d="M17 16v-7" />
          <path d="M14 7l3-3 3 3" />
        </svg>
      );
    case "transform":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3" />
          <path d="M6 20c1.5-3 4-4.5 6-4.5S16.5 17 18 20" />
          <path d="M19 8a7 7 0 1 1-2-4.9" />
          <path d="M19 3v5h-5" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "accounting":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 20h8" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      );
    case "advisory":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M17 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M3 19c.8-3 2.8-4.5 5-4.5" />
          <path d="M21 19c-.8-3-2.8-4.5-5-4.5" />
          <path d="M9.5 14.5C10.5 14 11.2 14 12 14s1.5 0 2.5.5" />
        </svg>
      );
    case "tax":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12" />
          <circle cx="8" cy="16" r="2" />
          <circle cx="16" cy="8" r="2" />
        </svg>
      );
    case "legal":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v18" />
          <path d="M5 8h14" />
          <path d="M7 8l-3 6h6l-3-6z" />
          <path d="M17 8l-3 6h6l-3-6z" />
        </svg>
      );
    case "digital":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8l-4 4 4 4" />
          <path d="M16 8l4 4-4 4" />
          <path d="M13 6l-2 12" />
        </svg>
      );
    case "people":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 19c1-3.2 3.2-5 6-5s5 1.8 6 5" />
          <path d="M14.5 14.2c1.7.3 3.2 1.4 4.5 4.8" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
  }
}
