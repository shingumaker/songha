import { useRef, useState } from 'react';
import { useCard } from '../context/CardContext';
import { exportCardAsImage } from '../lib/exportCardImage';
import BadgePreview from './BadgePreview';
import InfographicRenderer from './infographics/InfographicRenderer';

export default function LivePreview() {
  const {
    style,
    template,
    fields,
    links,
    portfolio,
    personality,
    favorites,
    photoPreview,
    avatarIcon,
    issuedCard,
    statusLine,
  } = useCard();
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);

  if (!style) {
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
    avatarIcon,
    id: issuedCard?.id,
    // License/Membership show a "date of issue" field; before the card is
    // actually issued there's no real timestamp yet, so show today's date as
    // a live estimate, then switch to the real saved value once issued.
    createdAt: issuedCard?.createdAt || Date.now(),
  };

  const saveAsImage = async () => {
    setSaving(true);
    try {
      await exportCardAsImage(cardRef.current, style, `profile-card-${issuedCard?.id || 'preview'}.png`);
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="preview-wrap">
      <div className="preview-label">실시간 미리보기</div>
      <div ref={cardRef} style={{ width: '100%' }}>
        <InfographicRenderer card={card} />
      </div>
      {issuedCard && (
        <>
          <div className="url-box">{issuedCard.url}</div>
          <button className="ghost" style={{ width: '100%', marginTop: 10 }} onClick={saveAsImage} disabled={saving}>
            {saving ? '저장 중...' : '이미지로 저장'}
          </button>
        </>
      )}
      <div className="status-line">{statusLine}</div>
    </div>
  );
}
