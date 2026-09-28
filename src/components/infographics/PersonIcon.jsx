export default function PersonIcon({ color = 'currentColor', size = '55%' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="8.5" r="4.8" fill={color} />
      <path d="M0 24c0-6.6 5.4-11.2 12-11.2S24 17.4 24 24Z" fill={color} />
    </svg>
  );
}
