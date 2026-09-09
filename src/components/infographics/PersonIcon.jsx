export default function PersonIcon({ color = 'currentColor', size = '55%' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="8" r="4.2" fill={color} />
      <path d="M3.5 21c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5" fill={color} />
    </svg>
  );
}
