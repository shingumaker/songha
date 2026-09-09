import PersonIcon from './PersonIcon';

export default function ScrapbookInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%', background: '#ece6d8', padding: 20, boxSizing: 'border-box', borderRadius: 16 }}>
      <Tape align="flex-start" indent={40} rotate={-8} color="rgba(232,103,44,0.35)" width={90} />
      <Note rotate={-1.2}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 70, height: 70, background: '#f0ece0', border: '2px solid #2c2a22', flexShrink: 0, transform: 'rotate(-2deg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PersonIcon color="#8a8470" />}
          </div>
          <div>
            <div style={{ fontFamily: "'Caveat',cursive", fontWeight: 700, fontSize: 34, color: '#2c2a22', lineHeight: 1 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#6b6656', marginTop: 4 }}>{[org, role].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        {intro && (
          <div style={{ marginTop: 14, fontFamily: "'Caveat',cursive", fontSize: 20, color: '#3a3226', lineHeight: 1.4 }}>
            &ldquo;{intro}&rdquo;
          </div>
        )}
      </Note>

      {(personality?.length > 0 || favorites?.length > 0) && (
        <>
          <Tape align="flex-end" indent={60} rotate={6} color="rgba(79,138,124,0.35)" width={70} />
          <Note rotate={0.8} style={{ display: 'flex', gap: 20 }}>
            {personality?.length > 0 && (
              <div style={{ flex: 1 }}>
                <NoteHeader>성격</NoteHeader>
                <div style={{ fontSize: 12, color: '#4a4739', lineHeight: 2 }}>
                  {personality.map((p, i) => (
                    <div key={i}>· {p.title}</div>
                  ))}
                </div>
              </div>
            )}
            {favorites?.length > 0 && (
              <div style={{ flex: 1 }}>
                <NoteHeader>좋아하는 것</NoteHeader>
                <div style={{ fontSize: 12, color: '#4a4739', lineHeight: 2 }}>
                  {favorites.map((f, i) => (
                    <div key={i}>· {f.title}</div>
                  ))}
                </div>
              </div>
            )}
          </Note>
        </>
      )}

      {(hasPortfolio || links?.length > 0) && (
        <>
          <Tape align="flex-start" indent={80} rotate={-5} color="rgba(155,143,196,0.35)" width={80} />
          <Note rotate={-0.6}>
            {hasPortfolio &&
              portfolio.map((p, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, color: '#2c2a22' }}>📌 {p.title}</div>
                  {p.desc && <div style={{ fontSize: 12, color: '#4a4739' }}>{p.desc}</div>}
                </div>
              ))}
            {links?.map((l, i) => (
              <div
                key={i}
                style={{
                  marginTop: 6,
                  display: 'inline-block',
                  background: '#f0ece0',
                  border: '1px dashed #2c2a22',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontFamily: "'IBM Plex Mono',monospace",
                }}
              >
                {l}
              </div>
            ))}
          </Note>
        </>
      )}

      {id && (
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#8a8470' }}>
          ID · {id.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function Tape({ align, indent, rotate, color, width }) {
  return (
    <div style={{ display: 'flex', justifyContent: align, paddingLeft: align === 'flex-start' ? indent : 0, paddingRight: align === 'flex-end' ? indent : 0 }}>
      <div
        style={{
          width,
          height: 22,
          marginBottom: -14,
          background: color,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          transform: `rotate(${rotate}deg)`,
          zIndex: 1,
          position: 'relative',
        }}
      />
    </div>
  );
}

function Note({ rotate, style, children }) {
  return (
    <div
      style={{
        background: '#fffdf7',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        padding: '18px 20px',
        borderRadius: 2,
        transform: `rotate(${rotate}deg)`,
        marginTop: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NoteHeader({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 12,
        color: '#2c2a22',
        borderBottom: '2px solid #2c2a22',
        paddingBottom: 5,
        marginBottom: 10,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  );
}
