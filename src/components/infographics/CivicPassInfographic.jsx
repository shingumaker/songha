import { darken, lighten } from './colorUtils';
import AvatarDisplay from './AvatarDisplay';

const ACCENT = '#0b6b4f';
const NAVY = '#122b5e';
const BURGUNDY = '#6b1f2f';

function formatIdNumber(id) {
  const base = (id || 'guest0').toUpperCase().padEnd(6, '0').repeat(2).slice(0, 12);
  return base.match(/.{1,4}/g).join('  ');
}

const BAR_PATTERN = [
  [2, 1], [1, 1], [1, 1], [1, 1], [2, 2], [1, 2], [2, 1], [1, 1], [1, 1], [3, 2],
  [1, 2], [1, 2], [2, 1], [2, 2], [2, 1], [1, 1], [2, 1], [1, 1], [2, 1], [1, 1],
  [1, 1], [2, 2], [2, 1], [2, 2], [3, 1], [2, 1], [3, 1], [2, 2], [2, 2], [1, 1],
  [1, 1], [2, 1], [1, 1], [2, 1], [2, 1], [1, 1], [2, 1], [2, 1], [2, 1], [3, 1],
  [3, 1], [1, 2], [2, 1], [2, 2], [1, 1], [1, 1], [1, 1], [2, 1], [1, 1], [3, 1],
  [1, 2], [2, 2], [1, 1], [1, 1], [2, 0],
];

export default function CivicPassInfographic({ card }) {
  const accentLight = lighten(ACCENT, 0.35);
  const accentDark = darken(ACCENT, 0.65);
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
          background: 'linear-gradient(135deg, #eef2fb 0%, #f7f3e8 100%)',
          boxShadow: '0 14px 32px rgba(18,43,94,0.26)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(18,43,94,0.05) 0px, rgba(18,43,94,0.05) 1px, transparent 1px, transparent 6px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%,-50%) rotate(-10deg)',
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 800,
            fontSize: 30,
            color: ACCENT,
            opacity: 0.06,
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}
        >
          REPUBLIC OF CREATIVITY
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 46,
            background: `linear-gradient(120deg, ${accentLight} 0%, ${ACCENT} 55%, ${accentDark} 100%)`,
            borderRadius: '14px 14px 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${BURGUNDY} 0%, #a8425a 40%, transparent 85%)`,
          }}
        />

        <div
          style={{
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 8, letterSpacing: '0.04em' }}>
              2026 SHINGU EXPO.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 10, color: '#fff', letterSpacing: '0.01em' }}>
                REPUBLIC OF CREATIVITY SHINGU
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M6 8a6 6 0 0 1 0 8M9 5a10 10 0 0 1 0 14M3 11a2 2 0 0 1 0 2" />
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexGrow: 1 }}>
            <div
              style={{
                width: 92,
                height: 108,
                borderRadius: 8,
                border: `1.5px solid ${NAVY}59`,
                background: '#fff',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={92} color={NAVY} />
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: NAVY, lineHeight: 1.25 }}>
                {name}
              </div>
              {(org || role) && (
                <div style={{ fontSize: 15, color: '#6b7a99', marginTop: 3, lineHeight: 1.25 }}>
                  {[org, role].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', columnGap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: NAVY, letterSpacing: '0.05em', justifySelf: 'start' }}>
              {formatIdNumber(id)}
            </div>
            <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'flex-end', height: 12 }}>
              {BAR_PATTERN.map(([w, mr], i) => (
                <div key={i} style={{ width: w, height: 12, background: NAVY, marginRight: mr }} />
              ))}
            </div>
            <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#c8102e', opacity: 0.85 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: NAVY, opacity: 0.85, marginLeft: -4 }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 8, color: NAVY, marginLeft: 4 }}>
                PASS
              </span>
            </div>
          </div>
        </div>
      </div>

      {(intro || personality?.length > 0 || favorites?.length > 0 || hasPortfolio || links?.length > 0) && (
        <div style={{ marginTop: 16, background: '#f7f3e8', borderRadius: 12, padding: '16px 18px', boxShadow: '0 12px 30px rgba(30,50,90,0.14)' }}>
          {intro && (
            <div style={{ fontSize: 12, color: '#2c2a22', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center' }}>
              MOTTO &middot; &ldquo;{intro}&rdquo;
            </div>
          )}
          {personality?.length > 0 && (
            <div style={{ marginTop: intro ? 14 : 0 }}>
              <SectionLabel color={BURGUNDY}>DISTINGUISHING FEATURES / 특기사항</SectionLabel>
              <div style={{ fontSize: 12, color: '#2c2a22', lineHeight: 1.9 }}>{personality.map((p) => p.title).join(' · ')}</div>
            </div>
          )}
          {favorites?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <SectionLabel color={BURGUNDY}>ENDORSEMENTS / 관심 분야</SectionLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {favorites.map((f, i) => (
                  <Stamp key={i} label={f.title} color={BURGUNDY} />
                ))}
              </div>
            </div>
          )}
          {(hasPortfolio || links?.length > 0) && (
            <div style={{ marginTop: 14, background: `${NAVY}0f`, border: `1px solid ${NAVY}33`, borderRadius: 4, padding: '10px 12px' }}>
              <SectionLabel color={BURGUNDY}>{hasPortfolio ? '프로젝트' : '링크'}</SectionLabel>
              {hasPortfolio
                ? portfolio.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: NAVY, marginTop: 4 }}>
                      {p.title}
                      {p.desc && ` — ${p.desc}`}
                    </div>
                  ))
                : links.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: NAVY, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
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

function SectionLabel({ color, children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color, letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function Stamp({ label, color }) {
  return (
    <div
      style={{
        border: `1.5px dashed ${color}`,
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
      <span style={{ fontSize: 9, fontWeight: 700, color, lineHeight: 1.2, padding: '0 4px' }}>{label}</span>
    </div>
  );
}
