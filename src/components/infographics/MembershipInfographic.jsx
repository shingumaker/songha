import AvatarDisplay from './AvatarDisplay';

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
          aspectRatio: '1.6 / 1',
          borderRadius: 14,
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

        <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px' }}>
                <svg width="50" height="22" viewBox="0 0 50 22" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                  <ellipse cx="25" cy="11" rx="24" ry="9" fill="none" stroke="#1a1a1a" strokeWidth="1.2" transform="rotate(-3 25 11)" />
                </svg>
                <span style={{ position: 'relative', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: '0.01em' }}>
                  Team
                </span>
              </div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 12, letterSpacing: '-0.01em' }}>
                Makerspace
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 6.5, letterSpacing: '0.02em' }}>IDENTIFICATION CARD</div>
              <div style={{ fontSize: 6, color: '#555', marginTop: 2 }}>NO. {idNumber(id)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexGrow: 1 }}>
            <div style={{ width: 62, height: 78, flexShrink: 0, borderRadius: '50%', background: '#e4e4e4', overflow: 'hidden' }}>
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={62} color="#999" />
            </div>
            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
              {fields.map((f) => (
                <div key={f.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 6.5, whiteSpace: 'nowrap' }}>{f.label}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 8,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '58%',
                      }}
                    >
                      {f.value || ' '}
                    </span>
                  </div>
                  <div style={{ borderBottom: '1px dashed #999', marginTop: 2 }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', marginBottom: 44, maxWidth: '62%', fontSize: 5.2, color: '#333', lineHeight: 1.35, textAlign: 'right' }}>
            이 카드를 소지한 사람은 Makerspace의 멤버임을 증명합니다.
            <br />
            This card certifies the bearer as a member of Makerspace.
          </div>
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
                    <div key={i} style={{ fontSize: 12, color: '#222', marginTop: 4 }}>
                      {p.title}
                      {p.desc && ` — ${p.desc}`}
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
    <div
      style={{
        position: 'absolute',
        right: 10,
        bottom: 8,
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: '1.3px dashed #3a7ca8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transform: 'rotate(-8deg)',
        opacity: 0.55,
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 4.8, fontWeight: 700, color: '#2f6690', lineHeight: 1.25 }}>
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
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: '#1a1a1a', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}
