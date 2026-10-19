export function normalizeUrl(url) {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Best-effort platform recognition for the link-in-bio style — matched by
// domain so plain "instagram.com/..." input (no scheme required) still gets
// a friendly label/icon instead of showing the raw URL.
const PLATFORMS = [
  { test: /instagram\.com/i, label: 'Instagram', emoji: '📸', tint: '#fde7ef' },
  { test: /facebook\.com|fb\.com/i, label: 'Facebook', emoji: '📘', tint: '#e7f0fe' },
  { test: /(youtube\.com|youtu\.be)/i, label: 'YouTube', emoji: '▶️', tint: '#fde7e7' },
  { test: /(twitter\.com|x\.com)/i, label: 'X (Twitter)', emoji: '✕', tint: '#ececec' },
  { test: /github\.com/i, label: 'GitHub', emoji: '🐙', tint: '#ececec' },
  { test: /tiktok\.com/i, label: 'TikTok', emoji: '🎵', tint: '#ececec' },
  { test: /blog\.naver\.com|naver\.me/i, label: '네이버 블로그', emoji: '📝', tint: '#e6f9ee' },
  { test: /linkedin\.com/i, label: 'LinkedIn', emoji: '💼', tint: '#e7f0fe' },
  { test: /notion\.(so|site)/i, label: 'Notion', emoji: '🗒️', tint: '#ececec' },
  { test: /behance\.net/i, label: 'Behance', emoji: '🎨', tint: '#e7eefe' },
  { test: /threads\.net/i, label: 'Threads', emoji: '🧵', tint: '#ececec' },
  { test: /kakao\.com/i, label: '카카오톡', emoji: '💬', tint: '#fff8d9' },
  { test: /velog\.io/i, label: 'Velog', emoji: '✍️', tint: '#e6fbf2' },
  { test: /brunch\.co\.kr/i, label: 'Brunch', emoji: '🍂', tint: '#fdeee0' },
];

export function detectPlatform(raw) {
  const href = normalizeUrl(raw);
  const match = PLATFORMS.find((p) => p.test.test(raw));
  if (match) return { label: match.label, emoji: match.emoji, tint: match.tint, href };
  let label = raw;
  try {
    label = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    // not a parseable URL — fall back to showing the raw text as typed
  }
  return { label, emoji: '🔗', tint: '#f0f0f0', href };
}
