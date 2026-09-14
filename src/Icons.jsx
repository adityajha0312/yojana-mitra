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
