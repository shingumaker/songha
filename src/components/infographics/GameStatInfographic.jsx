export default function GameStatInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;
  const stats = personality?.length
    ? personality.slice(0, 3).map((p, i) => ({ label: p.title, value: 95 - i * 5 }))
    : [];

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          background: '#242a42',
          borderRadius: 22,
          padding: '26px 24px 30px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ background: '#4ee6c8', color: '#12162a', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, padding: '5px 12px', borderRadius: 999 }}>
            발급 완료
          </div>
          {id && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#6b7290' }}>
              ID · {id.toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 16, background: '#12162a', border: '2px solid #4ee6c8', flexShrink: 0, overflow: 'hidden' }}>
            {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            <div style={{ display: 'inline-block', background: '#ff6fa5', color: '#12162a', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, padding: '2px 9px', borderRadius: 6, marginBottom: 6 }}>
              Lv.1 신입
            </div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 26, color: '#fff', lineHeight: 1.1 }}>
              {name}
            </div>
            <div style={{ fontSize: 12, color: '#8a90ad', marginTop: 4 }}>{[org, role].filter(Boolean).join(' · ')}</div>
          </div>
        </div>

        {intro && (
          <div style={{ marginTop: 16, background: '#12162a', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#c9cde0', lineHeight: 1.5 }}>
            &ldquo;{intro}&rdquo;
          </div>
        )}

        {stats.length > 0 && (
          <>
            <SecLabel>STAT</SecLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8a90ad', marginBottom: 4 }}>
                    <span>{s.label}</span>
                    <span>{s.value}</span>
                  </div>
                  <div style={{ height: 8, background: '#12162a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${s.value}%`, height: '100%', background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {favorites?.length > 0 && (
          <>
            <SecLabel>좋아하는 것</SecLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {favorites.map((f, i) => (
                <span key={i} style={{ background: '#12162a', color: '#c9cde0', fontSize: 11, padding: '6px 12px', borderRadius: 999, border: '1px solid #333a5c' }}>
                  {f.title}
                </span>
              ))}
            </div>
          </>
        )}

        {(hasPortfolio || links?.length > 0) && (
          <>
            <SecLabel>{hasPortfolio ? '진행 중인 퀘스트' : '링크'}</SecLabel>
            <div style={{ background: '#12162a', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              {hasPortfolio ? (
                portfolio.map((p, i) => (
                  <div key={i} style={{ marginBottom: i === portfolio.length - 1 ? 0 : 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{p.title}</div>
                    {p.desc && <div style={{ fontSize: 11, color: '#8a90ad', marginTop: 3 }}>{p.desc}</div>}
                  </div>
                ))
              ) : (
                links.map((l, i) => (
                  <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#4ee6c8' }}>
                    {l}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const BAR_COLORS = [
  'linear-gradient(90deg,#4ee6c8,#7ff0da)',
  'linear-gradient(90deg,#ff6fa5,#ffa5c8)',
  'linear-gradient(90deg,#ffd166,#ffe29a)',
];

function SecLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, color: '#4ee6c8', letterSpacing: '0.06em', marginTop: 20, marginBottom: 10 }}>
      {children}
    </div>
  );
}
