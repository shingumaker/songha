import { darken, lighten } from './colorUtils';

const ACCENT = '#e8672c';

export default function ColorfulInfographic({ card }) {
  const accentDark = darken(ACCENT, 0.72);
  const accentSoft = lighten(ACCENT, 0.86);
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const initial = (name || '?').slice(0, 1);
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;
  const hasLink = links?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          background: '#fdf8f0',
          borderRadius: 26,
          padding: '34px 38px 40px',
          boxSizing: 'border-box',
          boxShadow: '0 24px 60px rgba(90,60,30,0.14)',
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
          >
            {photo ? (
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 34, color: '#fff' }}>
                {initial}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 38, color: accentDark, letterSpacing: '-0.01em', lineHeight: 1 }}>
              {name}
            </div>
            <div style={{ fontSize: 13, color: '#8a7f6c', marginTop: 6 }}>
              {[org, role].filter(Boolean).join(' · ')}
            </div>
            {intro && (
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 12,
                  background: accentSoft,
                  color: accentDark,
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: 8,
                  padding: '8px 14px',
                  maxWidth: 360,
                }}
              >
                {intro}
              </div>
            )}
          </div>

          <div style={{ width: 200, border: '1.5px solid #e7ddc9', borderRadius: 16, padding: '14px 16px', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.08em',
                color: accentDark,
                background: accentSoft,
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              PROFILE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <Row label="이름" value={name} />
              <Row label="소속" value={org} />
              <Row label="역할" value={role} />
              <Row label="발급 ID" value={id?.toUpperCase()} mono />
            </div>
          </div>
        </div>

        {(personality?.length > 0 || favorites?.length > 0 || hasLink || hasPortfolio) && (
          <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
            {personality?.length > 0 && (
              <Card title="성격" accentDark={accentDark}>
                {personality.map((p, i) => (
                  <Item key={i} title={p.title} desc={p.desc} accentSoft={accentSoft} accentDark={accentDark} />
                ))}
              </Card>
            )}
            {favorites?.length > 0 && (
              <Card title="좋아하는 것" accentDark={accentDark}>
                {favorites.map((f, i) => (
                  <Item key={i} title={f.title} desc={f.desc} accentSoft={accentSoft} accentDark={accentDark} />
                ))}
              </Card>
            )}
            {(hasLink || hasPortfolio) && (
              <Card title="링크 · 프로젝트" accentDark={accentDark}>
                {hasPortfolio &&
                  portfolio.map((p, i) => (
                    <div key={i} style={{ background: accentSoft, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#3a3226' }}>{p.title}</div>
                      {p.desc && <div style={{ fontSize: 11, color: '#8a7f6c', marginTop: 3 }}>{p.desc}</div>}
                    </div>
                  ))}
                {hasLink &&
                  links.map((l, i) => (
                    <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: accentDark, marginTop: i === 0 ? 0 : 6 }}>
                      {l}
                    </div>
                  ))}
              </Card>
            )}
          </div>
        )}

        {intro && (
          <div style={{ marginTop: 22, borderTop: '1.5px dashed #e2d5b8', paddingTop: 22 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: accentDark, marginBottom: 14 }}>
              {name}의 이야기
            </div>
            <div style={{ background: '#f7f1e4', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8a7f6c', marginBottom: 4 }}>한 줄로 말하면</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#3a3226', fontStyle: 'italic' }}>&ldquo;{intro}&rdquo;</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: '#a89a80' }}>{label}</span>
      <span style={{ color: '#3a3226', fontWeight: 600, fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined }}>{value}</span>
    </div>
  );
}

function Card({ title, accentDark, children }) {
  return (
    <div style={{ flex: '1 1 200px', border: '1.5px solid #eee3cd', borderRadius: 16, padding: '16px 16px 6px' }}>
      <div
        style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 700,
          fontSize: 12,
          color: '#fff',
          background: accentDark,
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 999,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Item({ title, desc, accentDark }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentDark, marginTop: 5, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#3a3226' }}>{title}</div>
        {desc && <div style={{ fontSize: 11, color: '#8a7f6c', marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
  );
}
