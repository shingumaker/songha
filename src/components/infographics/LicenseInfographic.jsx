import AvatarDisplay from './AvatarDisplay';
import stampImg from '../../assets/stamp-makerspace.webp';

const INK = '#16325c';

// All positions/sizes below are ported directly from the design canvas's
// 856x540 License.dc.html artboard, converted to container-query units
// (cqw = % of card width, cqh = % of card height) so the layout is a
// faithful proportional replica at any render size.
const cqw = (px) => `${(px / 856) * 100}cqw`;
const cqh = (px) => `${(px / 540) * 100}cqh`;

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
  const { name, org, role, template, links, portfolio, personality, favorites, photo, avatarIcon, id, createdAt } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  return (
    <div style={{ fontFamily: "'Courier Prime',monospace", width: '100%' }}>
      <div
        style={{
          aspectRatio: '856 / 540',
          containerType: 'size',
          borderRadius: 0,
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          background: '#d7e6f2',
          boxShadow: `0 ${cqh(30)} ${cqw(70)} rgba(20,50,80,0.22)`,
        }}
      >
        <div style={{ position: 'absolute', top: cqh(12), left: cqw(56), right: cqw(56), display: 'flex', justifyContent: 'space-between', color: INK, fontSize: cqw(22) }}>
          {STAR_ROW.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: cqh(12), left: cqw(56), right: cqw(56), display: 'flex', justifyContent: 'space-between', color: INK, fontSize: cqw(22) }}>
          {STAR_ROW.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', top: cqh(56), bottom: cqh(56), left: cqw(10), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: INK, fontSize: cqw(22) }}>
          {STAR_COL.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <div style={{ position: 'absolute', top: cqh(56), bottom: cqh(56), right: cqw(10), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: INK, fontSize: cqw(22) }}>
          {STAR_COL.map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <span style={{ position: 'absolute', top: cqh(12), left: cqw(20), color: INK, fontSize: cqw(22) }}>★</span>
        <span style={{ position: 'absolute', top: cqh(12), right: cqw(20), color: INK, fontSize: cqw(22) }}>★</span>
        <span style={{ position: 'absolute', bottom: cqh(12), left: cqw(20), color: INK, fontSize: cqw(22) }}>★</span>
        <span style={{ position: 'absolute', bottom: cqh(12), right: cqw(20), color: INK, fontSize: cqw(22) }}>★</span>

        <div style={{ position: 'absolute', top: cqh(44), bottom: cqh(44), left: cqw(44), right: cqw(44), display: 'flex', gap: cqw(22) }}>
          <div style={{ width: cqw(285), flexShrink: 0, alignSelf: 'center', display: 'flex', flexDirection: 'column', height: cqh(364) }}>
            <div style={{ width: cqw(285), height: cqh(340), background: '#eef4f8', border: `1px solid ${INK}4d`, overflow: 'hidden' }}>
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={92} color={INK} />
            </div>
            <div style={{ fontSize: cqw(11), color: INK, textAlign: 'right', padding: `${cqh(6)} ${cqw(2)}` }}>Photograph of Authorized maker</div>
          </div>

          <div style={{ flexGrow: 1, minWidth: 0, color: INK, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: cqw(22), letterSpacing: '0.01em', textAlign: 'center' }}>PERMANENT LICENSE OF MAKER</div>
              <div style={{ fontWeight: 700, fontSize: cqw(14), marginTop: cqh(6), textAlign: 'center' }}>NO. {licenseNumber(id)}</div>
            </div>

            <div style={{ fontSize: cqw(15), lineHeight: 2.1 }}>
              <FieldLine label="Issued to" value={name} />
              <FieldLine label="Affiliation" value={org} />
              <FieldLine label="Role / Title" value={role} />
              <FieldLine label="Date of issue" value={formatDate(createdAt)} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: cqw(16) }}>LICENSE OF MAKER</div>
              <div style={{ fontSize: cqw(13), marginTop: cqh(8), lineHeight: 1.7 }}>
                This is to certify that the person named and described above is permitted to create, build, and imagine freely without limitation.
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: cqw(16), height: cqh(18) }}>IMPORTANT</div>
              <div style={{ fontSize: cqw(13), lineHeight: 1.7 }}>
                The holder of this license designed, built, and shipped all works exhibited under this name, unless stated otherwise.
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', textAlign: 'center', fontSize: cqw(13), position: 'relative' }}>
              .......................................
              <div style={{ marginTop: cqh(2) }}>Signature of Authorized maker</div>
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
    <div style={{ display: 'flex', alignItems: 'baseline', gap: cqw(8) }}>
      <span>{label}</span>
      <span
        style={{
          flexGrow: 1,
          minWidth: 0,
          borderBottom: `1px dotted ${INK}`,
          fontFamily: "'Nanum Pen Script',cursive",
          fontSize: cqw(22),
          padding: `0 ${cqw(4)}`,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }}
      >
        {value || ' '}
      </span>
    </div>
  );
}

function Stamp() {
  return (
    <img
      src={stampImg}
      alt=""
      style={{
        position: 'absolute',
        top: cqh(280),
        left: cqw(124),
        width: cqw(302),
        height: cqh(143),
        opacity: 0.7,
        mixBlendMode: 'multiply',
        objectFit: 'cover',
        objectPosition: '53.2748% 56.3636%',
        objectViewBox: 'inset(14.9758% 5.8189% 11.5942% 6.6346%)',
        pointerEvents: 'none',
      }}
    />
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
