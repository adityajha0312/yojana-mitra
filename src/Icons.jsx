export function MicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M5 11 C5 15.5 8.5 19 12 19 C15.5 19 19 15.5 19 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="12" y1="19" x2="12" y2="22.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="22.5" x2="16" y2="22.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function StopIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill={color} />
    </svg>
  )
}

export function SpeakerOnIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9.5 V14.5 H7.5 L12.5 18.5 V5.5 L7.5 9.5 Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M16.5 8.5 C17.8 9.8 17.8 14.2 16.5 15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M19 5.5 C21.5 8 21.5 16 19 18.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  )
}

export function SpeakerOffIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9.5 V14.5 H7.5 L12.5 18.5 V5.5 L7.5 9.5 Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="16" y1="9" x2="21" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21" y1="9" x2="16" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MenuIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function PlusChatIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function GridIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
    </svg>
  )
}

export function DocumentIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3.5 H14.5 L19 8 V20.5 H7 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 3.5 V8 H19" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="9.5" y1="12.5" x2="16" y2="12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9.5" y1="16" x2="16" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BookmarkIcon({ size = 17, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5 4 H17.5 V20.5 L12 16.5 L6.5 20.5 Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </svg>
  )
}

export function UserCircleIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.7" stroke={color} strokeWidth="1.7" />
      <path d="M6.3 18.2 C7.3 15.8 9.4 14.5 12 14.5 C14.6 14.5 16.7 15.8 17.7 18.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsGearIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.7" />
      <path
        d="M12 3.5 V6 M12 18 V20.5 M20.5 12 H18 M6 12 H3.5 M17.6 6.4 L15.8 8.2 M8.2 15.8 L6.4 17.6 M17.6 17.6 L15.8 15.8 M8.2 8.2 L6.4 6.4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function GlobeIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.5" stroke={color} strokeWidth="1.6" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4.5" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 6.5 L18.5 12 L13 17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function SendIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 12 L20 4.5 L15.5 20.5 L11 13.5 L3.5 12 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
      <line x1="11" y1="13.5" x2="16.5" y2="8.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function HelpCircleIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.7" />
      <path d="M9.5 9.3 C9.5 7.7 10.6 6.7 12.1 6.7 C13.5 6.7 14.6 7.6 14.6 8.9 C14.6 10.9 12.1 10.7 12.1 13.1" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="12.1" cy="16.2" r="0.9" fill={color} />
    </svg>
  )
}

export function SearchIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.8" />
      <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
