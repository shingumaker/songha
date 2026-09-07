export default function Badge({ tag, photoSrc, name, role, intro, links = [], portfolio = [], cardId }) {
  return (
    <div className="badge">
      <div className="badge-top">
        <div className="badge-org">
          창의융합혁신센터
          <br />
          EXPO 2026
        </div>
        <div className="badge-tag">{tag || 'TYPE'}</div>
      </div>
      <div className="badge-photo">{photoSrc ? <img src={photoSrc} alt="프로필" /> : '사진'}</div>
      <div className="badge-name">{name || '이름을 입력하세요'}</div>
      <div className="badge-role">{role}</div>
      <div className="badge-intro">{intro}</div>
      <div className="badge-links">
        {links.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="portfolio-preview">
        {portfolio.map((p, i) => (
          <div className="pf" key={i}>
            <div className="pf-t">{p.title}</div>
            <div className="pf-d">{p.desc || ''}</div>
          </div>
        ))}
      </div>
      <div className="badge-foot">
        <div className="badge-id">ID · {cardId ? cardId.toUpperCase() : '------'}</div>
        <div className="nfc-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3a382f" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 0 8M9 5a10 10 0 0 1 0 14M3 11a2 2 0 0 1 0 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
