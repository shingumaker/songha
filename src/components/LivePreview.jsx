import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
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
    avatarIcon,
    issuedCard,
    statusLine,
  } = useCard();
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);

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
    avatarIcon,
    id: issuedCard?.id,
  };

  const saveAsImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `profile-card-${issuedCard?.id || 'preview'}.png`;
      link.href = dataUrl;
      link.click();
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
