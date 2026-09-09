import PersonIcon from './PersonIcon';

export default function BrowserInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%', background: '#5b6bb8', borderRadius: 20, padding: 24, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Win title="profile.exe">
        <div style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#eef0fb', border: '2px solid #241c4a', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PersonIcon color="#241c4a" />}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: '#241c4a' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#5b6bb8', fontWeight: 600 }}>{[org, role].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      </Win>

      {intro && (
        <Win title="about.txt">
          <div style={{ padding: '16px 18px', fontSize: 12, color: '#3a3a3a', lineHeight: 1.6 }}>&ldquo;{intro}&rdquo;</div>
        </Win>
      )}

      {personality?.length > 0 && (
        <Win title="traits.exe" accent="#ffe28a">
          <div style={{ padding: '14px 16px', fontSize: 11, color: '#241c4a', lineHeight: 1.9, fontWeight: 600 }}>
            {personality.map((p, i) => (
              <div key={i}>· {p.title}</div>
            ))}
          </div>
        </Win>
      )}

      {favorites?.length > 0 && (
        <Win title="likes.txt">
          <div style={{ padding: '14px 16px', fontSize: 11, color: '#3a3a3a', lineHeight: 1.9 }}>
            {favorites.map((f) => f.title).join(' · ')}
          </div>
        </Win>
      )}

      {(hasPortfolio || links?.length > 0) && (
        <Win title={hasPortfolio ? 'project.exe' : 'links.exe'} dark>
          <div style={{ padding: '14px 16px' }}>
            {hasPortfolio ? (
              portfolio.map((p, i) => (
                <div key={i} style={{ marginBottom: i === portfolio.length - 1 ? 0 : 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{p.title}</div>
                  {p.desc && <div style={{ fontSize: 11, color: '#c9befd', marginTop: 3 }}>{p.desc}</div>}
                </div>
              ))
            ) : (
              links.map((l, i) => (
                <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#ffe28a' }}>
                  {l}
                </div>
              ))
            )}
            {id && (
              <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#ffe28a' }}>
                ID · {id.toUpperCase()}
              </div>
            )}
          </div>
        </Win>
      )}
    </div>
  );
}

function Win({ title, accent, dark, children }) {
  return (
    <div style={{ background: dark ? '#241c4a' : accent || '#fff', border: '2px solid #241c4a', boxShadow: '4px 4px 0 rgba(36,28,74,0.4)', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: `2px solid ${dark ? '#5b6bb8' : '#241c4a'}` }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff6259' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c93f' }} />
        <span style={{ marginLeft: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: dark ? '#fff' : '#241c4a' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
