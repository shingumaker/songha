import { useCard } from '../context/CardContext';

export default function BadgePreview() {
  const { template, templateCopy, fields, links, portfolio, photoPreview, statusLine, issuedCard, galleryCount } =
    useCard();

  const roleLine = [fields.org.trim(), fields.role.trim()].filter(Boolean).join(' · ');
  const visibleLinks = links.filter((l) => l && l.trim());
  const visiblePortfolio = template === 'portfolio' ? portfolio.filter((p) => p.title) : [];

  return (
    <div className="preview-wrap">
      <div className="preview-label">실시간 미리보기</div>
      <div className="lanyard-hole"></div>
      <div className="badge">
        <div className="badge-top">
          <div className="badge-org">
            창의융합혁신센터
            <br />
            EXPO 2026
          </div>
          <div className="badge-tag">{templateCopy?.tag || 'TYPE'}</div>
        </div>
        <div className="badge-photo">
          {photoPreview ? <img src={photoPreview} alt="프로필" /> : '사진'}
        </div>
        <div className="badge-name">{fields.name.trim() || '이름을 입력하세요'}</div>
        <div className="badge-role">{roleLine}</div>
        <div className="badge-intro">{fields.intro.trim()}</div>
        <div className="badge-links">
          {visibleLinks.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        <div className="portfolio-preview">
          {visiblePortfolio.map((p, i) => (
            <div className="pf" key={i}>
              <div className="pf-t">{p.title}</div>
              <div className="pf-d">{p.desc || ''}</div>
            </div>
          ))}
        </div>
        <div className="badge-foot">
          <div className="badge-id">ID · {issuedCard ? issuedCard.id.toUpperCase() : '------'}</div>
          <div className="nfc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3a382f" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 0 8M9 5a10 10 0 0 1 0 14M3 11a2 2 0 0 1 0 2" />
            </svg>
          </div>
        </div>
      </div>
      {issuedCard && (
        <div className="url-box" style={{ display: 'block' }}>
          {issuedCard.url}
        </div>
      )}
      <div className="status-line">{statusLine}</div>
      <div className="gallery-count">
        {galleryCount !== null ? `지금까지 발급된 프로필: ${galleryCount}개` : ''}
      </div>
    </div>
  );
}
