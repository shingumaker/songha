import AvatarDisplay from './AvatarDisplay';

const INK = '#16325c';

function licenseNumber(id) {
  const base = (id || 'guest0').toUpperCase().padEnd(7, '0').slice(0, 7);
  return 'SH' + base;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

export default function LicenseInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, avatarIcon, id, createdAt } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Courier Prime',monospace", width: '100%' }}>
      <div
        style={{
          aspectRatio: '1.6 / 1',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          background: '#d7e6f2',
          boxShadow: '0 14px 32px rgba(20,50,80,0.3)',
        }}
      >
        <div style={{ position: 'absolute', top: 6, left: 26, right: 26, display: 'flex', justifyContent: 'space-between', color: INK, fontSize: 8 }}>
          {STAR_ROW.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 6, left: 26, right: 26, display: 'flex', justifyContent: 'space-between', color: INK, fontSize: 8 }}>
          {STAR_ROW.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 20, bottom: 20, left: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: INK, fontSize: 8 }}>
          {STAR_COL.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 20, bottom: 20, right: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: INK, fontSize: 8 }}>
          {STAR_COL.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <span style={{ position: 'absolute', top: 6, left: 8, color: INK, fontSize: 8 }}>★</span>
        <span style={{ position: 'absolute', top: 6, right: 8, color: INK, fontSize: 8 }}>★</span>
        <span style={{ position: 'absolute', bottom: 6, left: 8, color: INK, fontSize: 8 }}>★</span>
        <span style={{ position: 'absolute', bottom: 6, right: 8, color: INK, fontSize: 8 }}>★</span>

        <div style={{ position: 'absolute', inset: 20, display: 'flex', gap: 10 }}>
          <div style={{ width: 76, flexShrink: 0, alignSelf: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 76, height: 90, background: '#eef4f8', border: `1px solid ${INK}4d`, overflow: 'hidden' }}>
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={76} color={INK} />
            </div>
            <div style={{ fontSize: 5, color: INK, textAlign: 'right', padding: '3px 1px' }}>Photograph of Authorized maker</div>
          </div>

          <div style={{ flexGrow: 1, minWidth: 0, color: INK, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 8.5, letterSpacing: '0.01em', textAlign: 'center' }}>PERMANENT LICENSE OF MAKER</div>
              <div style={{ fontWeight: 700, fontSize: 6, marginTop: 2, textAlign: 'center' }}>NO. {licenseNumber(id)}</div>
            </div>

            <div style={{ fontSize: 6.5, lineHeight: 1.85 }}>
              <FieldLine label="Issued to" value={name} />
              <FieldLine label="Affiliation" value={org} />
              <FieldLine label="Interest / Major" value={intro} />
              <FieldLine label="Date of issue" value={formatDate(createdAt)} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 7 }}>LICENSE OF MAKER</div>
              <div style={{ fontSize: 5.3, marginTop: 3, lineHeight: 1.45 }}>
                This is to certify that the person named and described above is permitted to create, build, and imagine freely without limitation.
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 7 }}>IMPORTANT</div>
              <div style={{ fontSize: 5.3, lineHeight: 1.45 }}>
                The holder of this license designed, built, and shipped all works exhibited under this name, unless stated otherwise.
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', textAlign: 'center', fontSize: 5.5, position: 'relative' }}>
              .......................................
              <div style={{ marginTop: 1 }}>Signature of Authorized maker</div>
            </div>

            <Stamp />
          </div>
        </div>
      </div>

      {(personality?.length > 0 || favorites?.length > 0 || hasPortfolio || links?.length > 0) && (
        <div style={{ marginTop: 16, background: '#eef4f8', borderRadius: 12, padding: '16px 18px', boxShadow: '0 12px 30px rgba(20,50,80,0.14)' }}>
          {personality?.length > 0 && (
            <div>
              <SectionLabel>DISTINGUISHING FEATURES / 특기사항</SectionLabel>
              <div style={{ fontSize: 12, color: INK, lineHeight: 1.9 }}>{personality.map((p) => p.title).join(' · ')}</div>
            </div>
          )}
          {favorites?.length > 0 && (
            <div style={{ marginTop: personality?.length > 0 ? 14 : 0 }}>
              <SectionLabel>ENDORSEMENTS / 관심 분야</SectionLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {favorites.map((f, i) => (
                  <FavoriteStamp key={i} label={f.title} />
                ))}
              </div>
            </div>
          )}
          {(hasPortfolio || links?.length > 0) && (
            <div style={{ marginTop: 14, background: `${INK}0f`, border: `1px solid ${INK}33`, borderRadius: 4, padding: '10px 12px' }}>
              <SectionLabel>{hasPortfolio ? '프로젝트' : '링크'}</SectionLabel>
              {hasPortfolio
                ? portfolio.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: INK, marginTop: 4 }}>
                      {p.title}
                      {p.desc && ` — ${p.desc}`}
                    </div>
                  ))
                : links.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: INK, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
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

const STAR_ROW = Array.from({ length: 11 });
const STAR_COL = Array.from({ length: 7 });

function FieldLine({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span>{label}</span>
      <span
        style={{
          flexGrow: 1,
          minWidth: 0,
          borderBottom: `1px dotted ${INK}`,
          fontFamily: "'Nanum Pen Script',cursive",
          fontSize: 11,
          padding: '0 2px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {value || ' '}
      </span>
    </div>
  );
}

function Stamp() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 4,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: `1.5px dashed ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transform: 'rotate(-10deg)',
        opacity: 0.4,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 6, fontWeight: 700, color: INK, lineHeight: 1.3 }}>
        SHINGU
        <br />
        EXPO.
        <br />
        MAKERSPACE
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: '#6b1f2f', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function FavoriteStamp({ label }) {
  return (
    <div
      style={{
        border: '1.5px dashed #6b1f2f',
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
      <span style={{ fontSize: 9, fontWeight: 700, color: '#6b1f2f', lineHeight: 1.2, padding: '0 4px' }}>{label}</span>
    </div>
  );
}
