import { useCard } from '../context/CardContext';
import BadgePreview from './BadgePreview';
import InfographicRenderer from './infographics/InfographicRenderer';

export default function LivePreview() {
  const {
    step,
    style,
    template,
    fields,
    links,
    portfolio,
    personality,
    favorites,
    photoPreview,
    issuedCard,
    statusLine,
    galleryCount,
  } = useCard();

  if (step < 4 || !style) {
    return <BadgePreview />;
  }

  const card = {
    template,
    style,
    name: fields.name.trim(),
    org: fields.org.trim(),
    role: fields.role.trim(),
    intro: fields.intro.trim(),
    links: links.filter((l) => l && l.trim()),
    portfolio: portfolio.filter((p) => p.title),
    personality: personality.filter((p) => p.title),
    favorites: favorites.filter((f) => f.title),
    photo: photoPreview,
    id: issuedCard?.id,
  };

  return (
    <div className="preview-wrap">
      <div className="preview-label">실시간 미리보기</div>
      <InfographicRenderer card={card} />
      {issuedCard && <div className="url-box">{issuedCard.url}</div>}
      <div className="status-line">{statusLine}</div>
      <div className="gallery-count">
        {galleryCount !== null ? `지금까지 발급된 프로필: ${galleryCount}개` : ''}
      </div>
    </div>
  );
}
