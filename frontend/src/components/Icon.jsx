function Icon({ name = "file", className = "" }) {
  switch (name) {
    case "folder":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M3 6.5h6l2 2H21v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 8.5h18" stroke="currentColor" strokeWidth="1.6" opacity=".6"/>
        </svg>
      );

    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M4 22a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );

    case "chip":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M8 8h8v8H8V8Z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"
            stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );

    case "cube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 22V12" stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
          <path d="M21 7 12 12 3 7" stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );

    case "sliders":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M4 6h10" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M4 18h16" stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
          <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M14 6v0" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
          <path d="M10 12v0" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
          <path d="M16 18v0" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity=".7"/>
        </svg>
      );
	
	case "brain":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3v1a3 3 0 0 0 2 3v1a3 3 0 0 0 3 3"
            stroke="currentColor" strokeWidth="1.6"/>
          <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3v1a3 3 0 0 1-2 3v1a3 3 0 0 1-3 3"
            stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      );

	case "cpu":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="7" y="7" width="10" height="10" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"
            stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );

	case "gamepad":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M7 10h10a4 4 0 0 1 4 4l-1 3a2 2 0 0 1-3 1l-2-1H9l-2 1a2 2 0 0 1-3-1l-1-3a4 4 0 0 1 4-4Z"
            stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 13h2M9 12v2M16 13h.01M18 14h.01"
            stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      );

	case "network":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="19" cy="19" r="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M7 12h10M17 7l-8 4M17 17l-8-4"
            stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );

	case "dice":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3"
            stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="8" cy="8" r="1" fill="currentColor"/>
          <circle cx="16" cy="16" r="1" fill="currentColor"/>
          <circle cx="8" cy="16" r="1" fill="currentColor"/>
          <circle cx="16" cy="8" r="1" fill="currentColor"/>
        </svg>
      );

    case "file":
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.6" opacity=".7"/>
        </svg>
      );
  }
}

export { Icon };