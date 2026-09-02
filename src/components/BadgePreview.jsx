import { useCard } from '../context/CardContext';
import Badge from './Badge';

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
      <Badge
        tag={templateCopy?.tag}
        photoSrc={photoPreview}
        name={fields.name.trim()}
        role={roleLine}
        intro={fields.intro.trim()}
        links={visibleLinks}
        portfolio={visiblePortfolio}
        cardId={issuedCard?.id}
      />
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
