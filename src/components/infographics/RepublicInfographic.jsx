import AvatarDisplay from './AvatarDisplay';

const GUILLOCHE_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 30 Q15 10 30 30 T60 30' stroke='%23c8102e0d' fill='none' stroke-width='1'/%3E%3Cpath d='M0 15 Q15 -5 30 15 T60 15' stroke='%23122b5e0d' fill='none' stroke-width='1'/%3E%3Cpath d='M0 45 Q15 25 30 45 T60 45' stroke='%23122b5e0d' fill='none' stroke-width='1'/%3E%3C/svg%3E";

export default function RepublicInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, avatarIcon, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          background: `#f7f3e8 url("${GUILLOCHE_BG}")`,
          border: '2px solid #122b5e',
          borderRadius: 10,
          padding: '22px 24px',
          position: 'relative',
          boxShadow: '0 16px 40px rgba(18,43,94,0.18)',
        }}
      >
        <div style={{ position: 'absolute', inset: 6, border: '1px solid #c8102e', borderRadius: 6, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Emblem />
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: '#122b5e', letterSpacing: '0.04em' }}>
              REPUBLIC OF CREATIVITY
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#6b6152', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              창의공화국 · 공식 시민증
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 92,
                height: 108,
                background: '#e3d9c2',
                border: '1.5px solid #122b5e',
                overflow: 'hidden',
              }}
            >
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={92} color="#122b5e" />
            </div>
            <Hologram />
          </div>

          <div style={{ flex: 1, minWidth: 180, fontSize: 11.5, color: '#2c2a22', lineHeight: 2 }}>
            <RField label="SURNAME / 성명" value={name} big />
            <RField label="AFFILIATION / 소속" value={org} />
            <RField label="TITLE / 직함" value={role} />
            {id && <RField label="ID NO." value={id.toUpperCase()} mono />}
          </div>
        </div>

        {intro && (
          <div style={{ marginTop: 16, borderTop: '1px dashed #c8102e88', paddingTop: 10, fontSize: 11, color: '#2c2a22', fontStyle: 'italic', lineHeight: 1.6 }}>
            MOTTO &middot; &ldquo;{intro}&rdquo;
          </div>
        )}

        {personality?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <RLabel>DISTINGUISHING FEATURES / 특기사항</RLabel>
            <div style={{ fontSize: 10.5, color: '#2c2a22', lineHeight: 1.9 }}>
              {personality.map((p) => p.title).join(' · ')}
            </div>
          </div>
        )}

        {favorites?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <RLabel>ENDORSEMENTS / 관심 분야</RLabel>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {favorites.map((f, i) => (
                <Stamp key={i} label={f.title} />
              ))}
            </div>
          </div>
        )}

        {(hasPortfolio || links?.length > 0) && (
          <div style={{ marginTop: 14, background: 'rgba(18,43,94,0.06)', border: '1px solid #122b5e33', borderRadius: 4, padding: '10px 12px' }}>
            <RLabel>ACCESS LOG / {hasPortfolio ? '프로젝트' : '링크'}</RLabel>
            {hasPortfolio
              ? portfolio.map((p, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#122b5e', marginTop: 4 }}>
                    {p.title}
                    {p.desc && ` — ${p.desc}`}
                  </div>
                ))
              : links.map((l, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#122b5e', marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
                    {l}
                  </div>
                ))}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Barcode />
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: '#6b6152', textAlign: 'right' }}>
            ISSUED · REPUBLIC OF CREATIVITY
            <br />
            EXPO 2026
          </div>
        </div>
      </div>
    </div>
  );
}

function RField({ label, value, mono, big }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ color: '#8a7f6c', fontSize: 9, letterSpacing: '0.04em' }}>{label}</span>
      <div style={{ fontWeight: big ? 700 : 600, fontSize: big ? 16 : 12, fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined }}>
        {value}
      </div>
    </div>
  );
}

function RLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 9.5, color: '#c8102e', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function Emblem() {
  return (
    <svg width={30} height={30} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#122b5e" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#c8102e" strokeWidth="1" />
      <path d="M16 9l1.8 5.5H23l-4.6 3.4 1.8 5.6-4.2-3.5-4.2 3.5 1.8-5.6L9 14.5h5.2z" fill="#122b5e" />
    </svg>
  );
}

function Hologram() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -8,
        right: -8,
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #ffd1e8, #c8b8ff, #b8f0ff, #d1ffd6, #ffe9b8, #ffd1e8)',
        border: '1.5px solid #fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: 11, color: '#122b5eaa' }}>★</span>
    </div>
  );
}

function Stamp({ label }) {
  return (
    <div
      style={{
        border: '1.5px dashed #c8102e',
        borderRadius: '50%',
        width: 62,
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transform: 'rotate(-6deg)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: '#c8102e', lineHeight: 1.2, padding: '0 4px' }}>{label}</span>
    </div>
  );
}

function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 20 }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, height: 18, background: '#122b5e' }} />
      ))}
    </div>
  );
}
