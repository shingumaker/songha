import AvatarDisplay from './AvatarDisplay';
import { normalizeUrl, detectPlatform } from './linkUtils';

export default function LinkInBioInfographic({ card }) {
  const { name, org, role, intro, template, links, portfolio, personality, favorites, certifications, skills, photo, avatarIcon, id } = card;
  const hasPortfolio = template === 'portfolio' && portfolio?.length > 0;
  const visibleLinks = links?.filter(Boolean) || [];

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", width: '100%', background: '#f6f6f3', borderRadius: 24, padding: '34px 22px', boxSizing: 'border-box', textAlign: 'center' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', background: '#eee', border: '1px solid #e2e2e2' }}>
        <AvatarDisplay photo={photo} avatarIcon={avatarIcon} size={84} color="#b0b0b0" />
      </div>
      <div style={{ fontWeight: 800, fontSize: 19, color: '#15151a' }}>{name}</div>
      {(org || role) && (
        <div style={{ fontSize: 12, color: '#8a8a8a', marginTop: 4 }}>{[org, role].filter(Boolean).join(' · ')}</div>
      )}
      {intro && (
        <div style={{ fontSize: 13, color: '#3a3a3a', marginTop: 12, lineHeight: 1.6, padding: '0 4px' }}>{intro}</div>
      )}

      {(personality?.length > 0 || favorites?.length > 0 || certifications?.length > 0 || skills?.length > 0) && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {personality?.length > 0 && <TagRow label="성격" items={personality} />}
          {favorites?.length > 0 && <TagRow label="좋아하는 것" items={favorites} />}
          {certifications?.length > 0 && <TagRow label="자격증" items={certifications} />}
          {skills?.length > 0 && <TagRow label="스킬" items={skills} />}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        {visibleLinks.map((l, i) => {
          const p = detectPlatform(l);
          return (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#fff',
                border: '1.5px solid #1a1a1a',
                borderRadius: 14,
                padding: '12px 16px',
                textDecoration: 'none',
                color: '#15151a',
              }}
            >
              <IconBadge emoji={p.emoji} tint={p.tint} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.label}
              </span>
              <span style={{ color: '#bbb', fontSize: 15 }}>&rsaquo;</span>
            </a>
          );
        })}

        {hasPortfolio &&
          portfolio.map((pf, i) =>
            pf.link ? (
              <a
                key={`pf-${i}`}
                href={normalizeUrl(pf.link)}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #1a1a1a', borderRadius: 14, padding: '12px 16px', textDecoration: 'none', color: '#15151a' }}
              >
                {pf.image ? (
                  <img src={pf.image} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <IconBadge emoji="📎" tint="#f0f0f0" />
                )}
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pf.title}</div>
                  {pf.desc && <div style={{ fontSize: 11, color: '#8a8a8a', marginTop: 1 }}>{pf.desc}</div>}
                </span>
                <span style={{ color: '#bbb', fontSize: 15, flexShrink: 0 }}>&rsaquo;</span>
              </a>
            ) : (
              <div key={`pf-${i}`} style={{ background: '#fff', border: '1.5px solid #e2e2e2', borderRadius: 14, padding: '12px 16px', textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{pf.title}</div>
                {pf.desc && <div style={{ fontSize: 11, color: '#8a8a8a', marginTop: 1 }}>{pf.desc}</div>}
              </div>
            ),
          )}
      </div>

      {id && <div style={{ marginTop: 20, fontSize: 10, color: '#bbb', letterSpacing: '0.08em' }}>ID · {id.toUpperCase()}</div>}
    </div>
  );
}

function IconBadge({ emoji, tint }) {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {emoji}
    </span>
  );
}

function TagRow({ label, items }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9a9a9a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'left' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it, i) => (
          <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#333', background: '#fff', border: '1px solid #e2e2e2', borderRadius: 999, padding: '4px 10px' }}>
            {it.title}
          </span>
        ))}
      </div>
    </div>
  );
}
