export default function MinimalInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%', background: '#fff', color: '#1a1a1a' }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: 18 }}>
        PROFILE
      </div>
      <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: 22, display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        <div style={{ width: 118, height: 118, background: '#f0f0f0', flexShrink: 0, overflow: 'hidden' }}>
          {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 34, color: '#1a1a1a', lineHeight: 1 }}>
            {name}
          </div>
          <div style={{ fontSize: 13, color: '#8a8a8a', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {role}
          </div>
          {intro && (
            <div style={{ fontSize: 13, color: '#3a3a3a', marginTop: 14, lineHeight: 1.7, maxWidth: 480 }}>{intro}</div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 14, fontSize: 12, color: '#5a5a5a', flexWrap: 'wrap' }}>
            {org && <span>{org}</span>}
            {id && <span>ID {id.toUpperCase()}</span>}
            {links?.[0] && <span>{links[0]}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
        {personality?.length > 0 && (
          <div style={{ flex: '1 1 220px' }}>
            <SecHeader>성격</SecHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
              {personality.map((p, i) => (
                <TextItem key={i} title={p.title} desc={p.desc} />
              ))}
            </div>
          </div>
        )}
        {favorites?.length > 0 && (
          <div style={{ flex: '1 1 220px' }}>
            <SecHeader>좋아하는 것</SecHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
              {favorites.map((f, i) => (
                <TextItem key={i} title={f.title} desc={f.desc} />
              ))}
            </div>
          </div>
        )}
      </div>

      {hasPortfolio && (
        <div>
          <SecHeader>PROJECT</SecHeader>
          {portfolio.map((p, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{p.title}</div>
              {p.desc && <div style={{ fontSize: 12, color: '#6a6a6a', marginTop: 2 }}>{p.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {intro && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e2e2', fontSize: 12, color: '#9a9a9a', fontStyle: 'italic' }}>
          &ldquo;{intro}&rdquo;
        </div>
      )}
    </div>
  );
}

function SecHeader({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        borderBottom: '1.5px solid #1a1a1a',
        paddingBottom: 8,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function TextItem({ title, desc }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: '#6a6a6a', marginTop: 2 }}>{desc}</div>}
    </div>
  );
}
