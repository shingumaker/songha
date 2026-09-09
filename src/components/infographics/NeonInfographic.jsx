import PersonIcon from './PersonIcon';

export default function NeonInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;
  const glow = { textShadow: '0 0 6px currentColor, 0 0 16px currentColor' };

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          background: '#121218',
          border: '1.5px solid #7ef9ff',
          borderRadius: 16,
          padding: '26px 24px',
          boxShadow: '0 0 30px rgba(126,249,255,0.25)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background: '#1c1c26',
              border: '2px solid #7ef9ff',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photo ? (
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <PersonIcon color="#7ef9ff" />
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 26, color: '#7ef9ff', ...glow }}>
          {name}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#8a8fb0', marginTop: 4 }}>
          {[org, role].filter(Boolean).join(' · ')}
        </div>

        {intro && (
          <div style={{ marginTop: 16, background: '#1c1c26', border: '1px solid #333a52', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#c9cde0', lineHeight: 1.6, textAlign: 'center' }}>
            &ldquo;{intro}&rdquo;
          </div>
        )}

        {personality?.length > 0 && (
          <>
            <NeonLabel color="#ff6fd8">▸ PERSONALITY</NeonLabel>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {personality.map((p, i) => (
                <span key={i} style={{ border: '1px solid #ff6fd8', color: '#ff6fd8', fontSize: 10, padding: '4px 10px', borderRadius: 6 }}>
                  {p.title}
                </span>
              ))}
            </div>
          </>
        )}

        {favorites?.length > 0 && (
          <>
            <NeonLabel color="#7ef9ff">▸ LIKES</NeonLabel>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {favorites.map((f, i) => (
                <span key={i} style={{ border: '1px solid #7ef9ff', color: '#7ef9ff', fontSize: 10, padding: '4px 10px', borderRadius: 6 }}>
                  {f.title}
                </span>
              ))}
            </div>
          </>
        )}

        {(hasPortfolio || links?.length > 0) && (
          <div style={{ marginTop: 16, background: 'linear-gradient(90deg,#7ef9ff22,#ff6fd822)', borderRadius: 10, padding: '12px 14px' }}>
            {hasPortfolio ? (
              portfolio.map((p, i) => (
                <div key={i} style={{ marginBottom: i === portfolio.length - 1 ? 0 : 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{p.title}</div>
                  {p.desc && <div style={{ fontSize: 10.5, color: '#8a8fb0', marginTop: 2 }}>{p.desc}</div>}
                </div>
              ))
            ) : (
              links.map((l, i) => (
                <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#fff' }}>
                  {l}
                </div>
              ))
            )}
          </div>
        )}

        {id && (
          <div style={{ marginTop: 16, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#7ef9ff' }}>
            ID · {id.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function NeonLabel({ color, children }) {
  return (
    <div style={{ marginTop: 18, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color, letterSpacing: '0.1em', textShadow: `0 0 6px ${color}` }}>
      {children}
    </div>
  );
}
