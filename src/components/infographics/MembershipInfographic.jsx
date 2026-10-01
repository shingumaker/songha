import AvatarDisplay from './AvatarDisplay';
import { normalizeUrl } from './linkUtils';
import stampImg from '../../assets/stamp-makerspace.webp';

// All positions/sizes below are ported directly from the design canvas's
// 856x540 Membership.dc.html artboard, converted to container-query units
// (cqw = % of card width, cqh = % of card height) so the layout is a
// faithful proportional replica at any render size.
const cqw = (px) => `${(px / 856) * 100}cqw`;
const cqh = (px) => `${(px / 540) * 100}cqh`;

function idNumber(id) {
  const base = (id || 'guest0').toUpperCase().padEnd(6, '0').slice(0, 6);
  return 'SH' + base;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MembershipInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, photo, avatarIcon, id, createdAt } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;

  const fields = [
    { label: '이름/Name', value: name },
    { label: '발급일/Date of issue', value: formatDate(createdAt) },
    { label: '직책/Role', value: role },
    { label: '관심사/Interest', value: intro },
    { label: '소속/Member of', value: org },
  ];

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%' }}>
      <div
        style={{
          aspectRatio: '856 / 540',
          containerType: 'size',
          borderRadius: 0,
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          background: '#ffffff',
          border: '1px solid #dcdcdc',
          boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
          color: '#1a1a1a',
        }}
      >
        <Stamp />

        {/* padding lives on this inner wrapper (not the query-container card
            itself) so cqw/cqh keep resolving against the full 856x540 card,
            matching the canvas's own coordinate space exactly */}
        <div style={{ position: 'absolute', inset: 0, boxSizing: 'border-box', padding: `${cqh(36)} ${cqw(42)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: cqw(16) }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: `${cqh(5)} ${cqw(18)}` }}>
                <svg viewBox="0 0 140 62" style={{ position: 'absolute', inset: 0, width: cqw(140), height: cqh(62), overflow: 'visible' }}>
                  <ellipse cx="70" cy="31" rx="67" ry="26" fill="none" stroke="#1a1a1a" strokeWidth="3" transform="rotate(-3 70 31)" />
                </svg>
                <span style={{ position: 'relative', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: cqw(36), letterSpacing: '0.01em' }}>
                  Team
                </span>
              </div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: cqw(36), letterSpacing: '-0.01em' }}>
                Makerspace
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: cqw(8) }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: cqw(17), letterSpacing: '0.03em' }}>IDENTIFICATION CARD</div>
                <div style={{ fontSize: cqw(14), color: '#555', marginTop: cqh(3) }}>NO. {idNumber(id)}</div>
              </div>
              <span style={{ fontSize: cqw(21), color: '#999' }}>&rsaquo;</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: cqw(34), marginTop: cqh(28) }}>
            <div style={{ width: cqw(283), height: cqh(346), flexShrink: 0, borderRadius: '50%', background: '#e4e4e4', overflow: 'hidden' }}>
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={80} color="#999" />
            </div>
            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cqh(17) }}>
              {fields.map((f) => (
                <div key={f.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cqw(13) }}>
                    <span style={{ fontWeight: 700, fontSize: cqw(17), whiteSpace: 'nowrap' }}>{f.label}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: cqw(21),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '58%',
                      }}
                    >
                      {f.value || ' '}
                    </span>
                  </div>
                  <div style={{ borderBottom: '1px dashed #999', marginTop: cqh(5) }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', left: cqw(358), top: cqh(446), width: cqw(395), fontSize: cqw(14), color: '#333', lineHeight: 1.5, textAlign: 'right' }}>
          이 카드를 소지한 사람은 Makerspace의 멤버임을 증명합니다.
          <br />
          This card certifies the bearer as a member of Makerspace.
        </div>
      </div>

      {(personality?.length > 0 || favorites?.length > 0 || hasPortfolio || links?.length > 0) && (
        <div style={{ marginTop: 16, background: '#f7f7f5', borderRadius: 12, padding: '16px 18px', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}>
          {personality?.length > 0 && (
            <div>
              <SectionLabel>특기사항</SectionLabel>
              <div style={{ fontSize: 12, color: '#222', lineHeight: 1.9 }}>{personality.map((p) => p.title).join(' · ')}</div>
            </div>
          )}
          {favorites?.length > 0 && (
            <div style={{ marginTop: personality?.length > 0 ? 14 : 0 }}>
              <SectionLabel>관심 분야</SectionLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {favorites.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      border: '1px dashed #1a1a1a',
                      borderRadius: 999,
                      padding: '5px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#222',
                    }}
                  >
                    {f.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(hasPortfolio || links?.length > 0) && (
            <div style={{ marginTop: 14, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '10px 12px' }}>
              <SectionLabel>{hasPortfolio ? '프로젝트' : '링크'}</SectionLabel>
              {hasPortfolio
                ? portfolio.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {p.image && (
                        <img src={p.image} alt="" style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      )}
                      <div style={{ fontSize: 12, color: '#222' }}>
                        {p.link ? (
                          <a href={normalizeUrl(p.link)} target="_blank" rel="noreferrer" style={{ color: '#222' }}>
                            {p.title}
                          </a>
                        ) : (
                          p.title
                        )}
                        {p.desc && ` — ${p.desc}`}
                      </div>
                    </div>
                  ))
                : links.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#222', marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
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

function Stamp() {
  return (
    <img
      src={stampImg}
      alt=""
      style={{
        position: 'absolute',
        right: cqw(37),
        bottom: cqh(39),
        width: cqw(130),
        height: cqh(72),
        opacity: 0.85,
        mixBlendMode: 'multiply',
        transform: 'rotate(-8deg)',
        pointerEvents: 'none',
      }}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: '#1a1a1a', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}
