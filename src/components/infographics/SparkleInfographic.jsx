export default function SparkleInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div
      style={{
        fontFamily: "'Noto Sans KR',sans-serif",
        width: '100%',
        background: 'linear-gradient(135deg,#dfe6ff 0%,#f7dcf0 50%,#ffe9d6 100%)',
        borderRadius: 20,
        padding: '30px 26px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <Star top={6} left={10} size={26} />
      <Star top={60} right={20} size={16} />
      <Star bottom={40} left={0} size={20} opacity={0.6} />

      <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', marginBottom: 14, border: '2px solid #241c4a' }}>
        {photo ? (
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 30, color: '#241c4a' }}>
            {(name || '?').slice(0, 1)}
          </div>
        )}
      </div>

      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 44, color: '#241c4a', letterSpacing: '-0.01em', lineHeight: 0.95 }}>
        {name}
      </div>
      <div style={{ borderTop: '1.5px solid #241c4a', width: '60%', marginTop: 14, paddingTop: 12, fontSize: 14, color: '#4a3a8a', fontWeight: 600 }}>
        {[org, role].filter(Boolean).join(' · ')}
      </div>

      {intro && (
        <div style={{ marginTop: 22, background: 'rgba(255,255,255,0.55)', borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: '#241c4a', lineHeight: 1.6 }}>{intro}</div>
        </div>
      )}

      {(personality?.length > 0 || favorites?.length > 0) && (
        <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          {personality?.length > 0 && (
            <div style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: '#241c4a', marginBottom: 8 }}>✦ 성격</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {personality.map((p, i) => (
                  <span key={i} style={{ background: '#241c4a', color: '#fff', fontSize: 10, padding: '4px 10px', borderRadius: 999 }}>
                    {p.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {favorites?.length > 0 && (
            <div style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: '#241c4a', marginBottom: 8 }}>✦ 좋아하는 것</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {favorites.map((f, i) => (
                  <span key={i} style={{ background: '#fff', color: '#241c4a', border: '1px solid #241c4a', fontSize: 10, padding: '4px 10px', borderRadius: 999 }}>
                    {f.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(hasPortfolio || links?.length > 0) && (
        <div style={{ marginTop: 18, background: '#241c4a', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: '#c9befd', marginBottom: 4 }}>
            ✦ {hasPortfolio ? 'Project' : 'Link'}
          </div>
          {hasPortfolio ? (
            portfolio.map((p, i) => (
              <div key={i} style={{ marginBottom: i === portfolio.length - 1 ? 0 : 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{p.title}</div>
                {p.desc && <div style={{ fontSize: 11, color: '#c9befd', marginTop: 2 }}>{p.desc}</div>}
              </div>
            ))
          ) : (
            links.map((l, i) => (
              <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#ffe28a' }}>
                {l}
              </div>
            ))
          )}
        </div>
      )}

      {id && (
        <div style={{ marginTop: 16, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4a3a8a', textAlign: 'right' }}>
          ID · {id.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function Star({ top, left, right, bottom, size, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', top, left, right, bottom, opacity }}>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" fill="#241c4a" />
    </svg>
  );
}
