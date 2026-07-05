export function StoreIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'bag') {
    return <svg {...common}><path d="M6.5 8.5h11l-.9 11h-9.2l-.9-11Z" /><path d="M9 8.5a3 3 0 0 1 6 0" /></svg>;
  }
  if (name === 'heart') {
    return <svg {...common}><path d="M20.5 8.8c0 5-8.5 10.2-8.5 10.2S3.5 13.8 3.5 8.8A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 8.5 1.5Z" /></svg>;
  }
  if (name === 'search') {
    return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
  }
  if (name === 'menu') {
    return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
  if (name === 'close') {
    return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  }
  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (name === 'minus') {
    return <svg {...common}><path d="M5 12h14" /></svg>;
  }
  if (name === 'truck') {
    return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></svg>;
  }
  if (name === 'arrow') {
    return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  }
  if (name === 'sparkles') {
    return <svg {...common}><path d="M12 3 10.4 8.4 5 10l5.4 1.6L12 17l1.6-5.4L19 10l-5.4-1.6L12 3Z" /><path d="M5 16.5 4.3 19 2 19.7 4.3 20.4 5 23l.7-2.6L8 19.7 5.7 19 5 16.5ZM19 14l-.8 2.8-2.7.7 2.7.8L19 21l.8-2.7 2.7-.8-2.7-.7L19 14Z" /></svg>;
  }
  if (name === 'shield') {
    return <svg {...common}><path d="M12 3.5 19 6.5v5.2c0 4.4-3 8.1-7 9.3-4-1.2-7-4.9-7-9.3V6.5L12 3.5Z" /><path d="m9 12 2 2 4-4.2" /></svg>;
  }
  if (name === 'check') {
    return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m8.3 12.4 2.4 2.4L16 9.3" /></svg>;
  }
  if (name === 'alert') {
    return <svg {...common}><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10.5v4" /><circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === 'info') {
    return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 11.2v5" /><circle cx="12" cy="8" r=".7" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === 'grid') {
    return <svg {...common}><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.2" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2" /><rect x="13" y="13" width="7.5" height="7.5" rx="1.2" /></svg>;
  }
  if (name === 'link') {
    return <svg {...common}><path d="M9.5 14.5 14.5 9.5" /><path d="M11 7.5 12.4 6a3.5 3.5 0 0 1 5 5L16 12.5" /><path d="M13 16.5 11.6 18a3.5 3.5 0 0 1-5-5L8 11.5" /></svg>;
  }
  return null;
}

export function SocialIcon({ type, size = 16 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'instagram') {
    return <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" stroke="none" /></svg>;
  }
  if (type === 'facebook') {
    return <svg {...common}><path d="M14 8h2V4h-2.4C10.8 4 9 5.8 9 8.6V11H6v4h3v5h4v-5h3l.6-4H13V8.7c0-.5.4-.7 1-.7Z" /></svg>;
  }
  if (type === 'twitter') {
    return <svg {...common}><path d="M4 4l16 16M20 4 4 20" /></svg>;
  }
  if (type === 'tiktok') {
    return <svg {...common}><path d="M14 4v10.2a4.2 4.2 0 1 1-4.2-4.2" /><path d="M14 4c.6 3 2.4 4.8 5 5" /></svg>;
  }
  if (type === 'whatsapp') {
    return <svg {...common}><path d="M7 17.5 4 20l1.2-3.8A7.6 7.6 0 1 1 12 19.6c-1.2 0-2.3-.3-3.3-.8L7 17.5Z" /><path d="M9 9.6c0 3 2.4 5.4 5.4 5.4" /></svg>;
  }
  if (type === 'email') {
    return <svg {...common}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>;
  }
  return null;
}
