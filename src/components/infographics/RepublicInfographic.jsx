import AvatarDisplay from './AvatarDisplay';

const WATERMARK_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Ccircle cx='45' cy='45' r='38' fill='none' stroke='%23ffffff' stroke-width='0.6' opacity='0.35'/%3E%3Ccircle cx='45' cy='45' r='26' fill='none' stroke='%23ffffff' stroke-width='0.6' opacity='0.35'/%3E%3C/svg%3E";

function formatIdNumber(id) {
  const base = (id || 'guest0').toUpperCase().padEnd(12, '0').repeat(2).slice(0, 12);
  return base.match(/.{1,4}/g).join('  ');
}

export default function RepublicInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, avatarIcon, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      {/* front face: card-shaped ID */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1.6 / 1',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #dce9f7 0%, #eef2fb 45%, #f7eef5 100%)',
          boxShadow: '0 18px 40px rgba(30,50,90,0.22)',
          padding: '16px 18px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${WATERMARK_BG}")`,
            backgroundSize: '70px 70px',
            transform: 'rotate(-8deg) scale(1.4)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div
            style={{
              background: '#c8102e',
              color: '#fff',
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.04em',
              padding: '4px 9px',
              borderRadius: 5,
            }}
          >
            EXPO ID
          </div>
          <NfcIcon />
        </div>

        <div
          style={{
            position: 'relative',
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: '#122b5e',
            letterSpacing: '0.02em',
            marginTop: 8,
          }}
        >
          REPUBLIC OF CREATIVITY
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, fontWeight: 400, color: '#6b7a99', letterSpacing: '0.06em', marginTop: 1 }}>
            창의공화국 · 공식 시민증
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-end', marginTop: 10 }}>
          <div
            style={{
              width: 62,
              height: 76,
              borderRadius: 6,
              border: '1.5px solid rgba(18,43,94,0.35)',
              overflow: 'hidden',
              flexShrink: 0,
              background: '#fff',
            }}
          >
            <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={62} color="#122b5e" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Chip />
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#122b5e', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: 9, color: '#6b7a99', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {[org, role].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#122b5e', letterSpacing: '0.06em' }}>
            {formatIdNumber(id)}
          </div>
          <Wordmark />
        </div>
      </div>

      {/* supplementary info below the card, on its own light panel for contrast */}
      {(intro || personality?.length > 0 || favorites?.length > 0 || hasPortfolio || links?.length > 0) && (
        <div
          style={{
            marginTop: 16,
            background: '#f7f3e8',
            borderRadius: 12,
            padding: '16px 18px',
            boxShadow: '0 12px 30px rgba(30,50,90,0.14)',
          }}
        >
          {intro && (
            <div style={{ fontSize: 11, color: '#2c2a22', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' }}>
              MOTTO &middot; &ldquo;{intro}&rdquo;
            </div>
          )}

          {personality?.length > 0 && (
            <div style={{ marginTop: intro ? 14 : 0 }}>
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
        </div>
      )}
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

function NfcIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#122b5e" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 0 8M9 5a10 10 0 0 1 0 14M3 11a2 2 0 0 1 0 2" />
    </svg>
  );
}

function Chip() {
  return (
    <div
      style={{
        width: 30,
        height: 22,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #f5d98a, #cf9f4a)',
        border: '1px solid rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.25)' }} />
    </div>
  );
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#c8102e', opacity: 0.85 }} />
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#122b5e', opacity: 0.85, marginLeft: -6 }} />
      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 11, color: '#122b5e', marginLeft: 5 }}>
        PASS
      </span>
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
