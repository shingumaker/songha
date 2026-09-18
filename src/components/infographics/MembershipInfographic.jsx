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
    { label: '소속/Member of', value: org },
    { label: '직책/Role', value: role },
    { label: '관심사/Interest', value: intro },
    { label: '발급일/Date of issue', value: formatDate(createdAt) },
  ].filter((f) => f.value);

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
        <Scribble />

        <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '68%', fontSize: 6, color: '#333', lineHeight: 1.45 }}>
            이 카드를 소지한 사람은 창의공화국의 멤버임을 증명합니다.
            <br />
            This card certifies the bearer as a member of Republic of Creativity.
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 10px' }}>
              {fields.map((f) => (
                <FieldPair key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
            <div style={{ width: 62, height: 62, borderRadius: 4, background: '#e4e4e4', overflow: 'hidden', flexShrink: 0 }}>
              <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={62} color="#999" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span
              style={{
                border: '1.5px solid #1a1a1a',
                borderRadius: 999,
                padding: '3px 10px',
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 800,
                fontSize: 9,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              TEAM SHINGU
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 7, letterSpacing: '0.02em' }}>IDENTIFICATION CARD</div>
              <div style={{ fontSize: 6, color: '#555', marginTop: 2 }}>NO. {idNumber(id)}</div>
            </div>
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

function FieldPair({ label, value }) {
  return (
    <div style={{ maxWidth: 64 }}>
      <div style={{ fontWeight: 700, fontSize: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ borderBottom: '1px dashed #999', margin: '2px 0' }} />
      <div style={{ fontSize: 5.5, color: '#555', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

function Scribble() {
  return (
    <svg width="30" height="24" viewBox="0 0 70 55" style={{ position: 'absolute', top: 8, right: 10, opacity: 0.5, transform: 'rotate(-6deg)' }}>
      <path
        d="M35 6 C14 6 6 18 8 30 C10 44 26 50 40 46 C54 42 60 28 52 16 C46 7 34 8 30 16"
        fill="none"
        stroke="#999"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, color: '#1a1a1a', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}
