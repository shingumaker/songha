export default function VintageInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          background: '#f3ecd9',
          border: '1.5px solid #b8a878',
          borderRadius: 6,
          padding: '22px 24px',
          position: 'relative',
          boxShadow: '0 16px 40px rgba(90,70,30,0.18)',
        }}
      >
        <div style={{ position: 'absolute', inset: 8, border: '1px dashed #b8a878', borderRadius: 3, pointerEvents: 'none' }} />
        <Burst top={-8} left={-8} />
        <Burst bottom={-8} right={-8} />

        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: '#6b5a3a', textAlign: 'center', textTransform: 'uppercase', marginBottom: 14 }}>
          Creative Fusion Innovation Center · Permanent ID
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 88, height: 104, background: '#d8cfae', border: '1.5px solid #6b5a3a', flexShrink: 0, overflow: 'hidden' }}>
            {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 180, fontSize: 11, color: '#4a3d28', lineHeight: 2 }}>
            <div><span style={{ color: '#8a7a52' }}>Name</span> &middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot; {name}</div>
            <div><span style={{ color: '#8a7a52' }}>Role</span> &middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot; {role}</div>
            <div><span style={{ color: '#8a7a52' }}>Org</span> &middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot; {org}</div>
            {id && <div><span style={{ color: '#8a7a52' }}>No.</span> &middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot; {id.toUpperCase()}</div>}
          </div>
        </div>

        {intro && (
          <div style={{ marginTop: 16, borderTop: '1px dashed #b8a878', paddingTop: 12, fontSize: 11, color: '#4a3d28', lineHeight: 1.6, fontStyle: 'italic' }}>
            &ldquo;{intro}&rdquo;
          </div>
        )}

        {(personality?.length > 0 || favorites?.length > 0) && (
          <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {personality?.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <VLabel>CHARACTER</VLabel>
                <div style={{ fontSize: 10.5, color: '#4a3d28', lineHeight: 1.9 }}>{personality.map((p) => p.title).join(' · ')}</div>
              </div>
            )}
            {favorites?.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <VLabel>INTERESTS</VLabel>
                <div style={{ fontSize: 10.5, color: '#4a3d28', lineHeight: 1.9 }}>{favorites.map((f) => f.title).join(' · ')}</div>
              </div>
            )}
          </div>
        )}

        {(hasPortfolio || links?.length > 0) && (
          <div style={{ marginTop: 14, background: 'rgba(184,168,120,0.18)', borderRadius: 4, padding: '10px 12px' }}>
            <VLabel>{hasPortfolio ? 'PROJECT' : 'LINK'}</VLabel>
            {hasPortfolio ? (
              portfolio.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: '#3a3226', marginTop: 3 }}>
                  {p.title}
                  {p.desc && ` — ${p.desc}`}
                </div>
              ))
            ) : (
              links.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: '#3a3226', marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>
                  {l}
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#8a7a52' }}>
          <span>ISSUED · EXPO 2026</span>
          <span>VALID UNTIL LOST</span>
        </div>
      </div>
    </div>
  );
}

function VLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: '#6b5a3a', letterSpacing: '0.06em', marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Burst({ top, left, right, bottom }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" style={{ position: 'absolute', top, left, right, bottom }}>
      <path d="M12 2l2.4 6.9 7.3.1-5.9 4.3 2.3 7-5.9-4.5-6 4.5 2.3-7-5.8-4.3 7.2-.1z" fill="#b8862c" />
    </svg>
  );
}
