import AvatarDisplay from './AvatarDisplay';

const ACCENT = '#e6b45a';

function formatIdNumber(id) {
  const base = (id || 'guest0').toUpperCase().padEnd(6, '0').repeat(2).slice(0, 12);
  return base.match(/.{1,4}/g).join('-');
}

const BAR_PATTERN = [
  [2, 1], [1, 1], [1, 1], [1, 1], [2, 2], [1, 2], [2, 1], [1, 1], [1, 1], [3, 2],
  [1, 2], [1, 2], [2, 1], [2, 2], [2, 1], [1, 1], [2, 1], [1, 1], [2, 1], [1, 1],
  [1, 1], [2, 2], [2, 1], [2, 2], [3, 1], [2, 1], [3, 1], [2, 2], [2, 2], [1, 1],
  [1, 1], [2, 1], [1, 1], [2, 1], [2, 1], [1, 1], [2, 1], [2, 1], [2, 1], [3, 1],
  [3, 1], [1, 2], [2, 1], [2, 2], [1, 1], [1, 1], [1, 1], [2, 1], [1, 1], [3, 1],
  [1, 2], [2, 2], [1, 1], [1, 1], [2, 0],
];

const QR_ROWS = [
  [1, 0, 1, 1, 0],
  [0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1],
];

export default function TechPassInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, avatarIcon, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          aspectRatio: '1.6 / 1',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          background: 'linear-gradient(160deg, #14171c 0%, #1f242c 100%)',
          boxShadow: '0 14px 32px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(230,180,90,0.05) 0px, rgba(230,180,90,0.05) 1px, transparent 1px, transparent 7px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 4,
            background: 'linear-gradient(180deg, #e6b45a, #7a4dd1, #2fb8c8, #e6b45a)',
          }}
        />

        <div
          style={{
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px 10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            color: '#e8e4da',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: ACCENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 800,
                  fontSize: 8,
                  color: '#14171c',
                }}
              >
                E
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.03em' }}>
                EXPO ACCESS
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 6, color: ACCENT, letterSpacing: '0.05em' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
              LEVEL 2 · ACTIVE
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexGrow: 1 }}>
            <div
              style={{
                width: 92,
                height: 108,
                borderRadius: 8,
                border: '1.5px solid rgba(232,228,218,0.25)',
                background: 'rgba(255,255,255,0.04)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={92} color="rgba(232,228,218,0.3)" />
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.25 }}>
                {name}
              </div>
              {(org || role) && (
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: ACCENT, marginTop: 3, letterSpacing: '0.01em', lineHeight: 1.25 }}>
                  {[org, role].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,4px)', gridTemplateRows: 'repeat(5,4px)', gap: 1, flexShrink: 0 }}>
              {QR_ROWS.flat().map((on, i) => (
                <div key={i} style={{ background: on ? '#e8e4da' : 'transparent' }} />
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'end',
              columnGap: 8,
              borderTop: '1px solid rgba(232,228,218,0.15)',
              paddingTop: 6,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 7, color: 'rgba(232,228,218,0.75)', letterSpacing: '0.04em', justifySelf: 'start' }}>
              ID · {formatIdNumber(id)}
            </div>
            <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'flex-end', height: 12 }}>
              {BAR_PATTERN.map(([w, mr], i) => (
                <div key={i} style={{ width: w, height: 12, background: '#fff', marginRight: mr }} />
              ))}
            </div>
            <div style={{ justifySelf: 'end', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 7, color: 'rgba(232,228,218,0.5)', letterSpacing: '0.06em' }}>
              EXPO 2026
            </div>
          </div>
        </div>
      </div>

      {(intro || personality?.length > 0 || favorites?.length > 0 || hasPortfolio || links?.length > 0) && (
        <div style={{ marginTop: 16, background: '#1f242c', borderRadius: 12, padding: '16px 18px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
          {intro && (
            <div style={{ fontSize: 12, color: '#e8e4da', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' }}>
              MOTTO &middot; &ldquo;{intro}&rdquo;
            </div>
          )}
          {personality?.length > 0 && (
            <div style={{ marginTop: intro ? 14 : 0 }}>
              <SectionLabel>DISTINGUISHING FEATURES / 특기사항</SectionLabel>
              <div style={{ fontSize: 12, color: '#e8e4da', lineHeight: 1.9 }}>{personality.map((p) => p.title).join(' · ')}</div>
            </div>
          )}
          {favorites?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <SectionLabel>ENDORSEMENTS / 관심 분야</SectionLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {favorites.map((f, i) => (
                  <Stamp key={i} label={f.title} />
                ))}
              </div>
            </div>
          )}
          {(hasPortfolio || links?.length > 0) && (
            <div style={{ marginTop: 14, background: 'rgba(232,228,218,0.06)', border: '1px solid rgba(232,228,218,0.15)', borderRadius: 4, padding: '10px 12px' }}>
              <SectionLabel>{hasPortfolio ? '프로젝트' : '링크'}</SectionLabel>
              {hasPortfolio
                ? portfolio.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#e8e4da', marginTop: 4 }}>
                      {p.title}
                      {p.desc && ` — ${p.desc}`}
                    </div>
                  ))
                : links.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#e8e4da', marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
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

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: ACCENT, letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function Stamp({ label }) {
  return (
    <div
      style={{
        border: `1.5px dashed ${ACCENT}`,
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
      <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, lineHeight: 1.2, padding: '0 4px' }}>{label}</span>
    </div>
  );
}
