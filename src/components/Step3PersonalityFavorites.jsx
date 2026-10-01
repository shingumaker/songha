import { useState } from 'react';
import { useCard } from '../context/CardContext';

export default function Step3PersonalityFavorites() {
  const {
    step,
    currentStepName,
    fields,
    updateField,
    personality,
    addPersonalityItem,
    updatePersonalityItem,
    removePersonalityItem,
    favorites,
    addFavoriteItem,
    updateFavoriteItem,
    removeFavoriteItem,
    goStep,
  } = useCard();
  const [introGenerating, setIntroGenerating] = useState(false);
  const [introError, setIntroError] = useState('');

  const generateIntro = async () => {
    if (introGenerating) return;
    setIntroGenerating(true);
    setIntroError('');
    try {
      const res = await fetch('/api/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          org: fields.org.trim(),
          role: fields.role.trim(),
          personality: personality.filter((p) => p.title).map((p) => p.title),
          favorites: favorites.filter((f) => f.title).map((f) => f.title),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '문구 생성에 실패했습니다.');
      updateField('intro', data.intro);
    } catch (err) {
      console.error('한 줄 소개 생성 실패:', err);
      setIntroError(err.message || '생성 중 오류가 발생했습니다.');
    } finally {
      setIntroGenerating(false);
    }
  };

  return (
    <div className={`panel${currentStepName === 'personality' ? ' active' : ''}`}>
      <label>
        성격 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(최대 3개, 선택)</span>
      </label>
      <div className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
        발급되는 인포그래픽 카드에 성격 키워드로 표시돼요.
      </div>
      {personality.map((item, idx) => (
        <div className="portfolio-item" key={idx}>
          <input
            type="text"
            placeholder="키워드 (예: 호기심이 많아요)"
            style={{ marginBottom: 8 }}
            value={item.title}
            onChange={(e) => updatePersonalityItem(idx, 'title', e.target.value)}
          />
          <textarea
            placeholder="한 줄 설명"
            value={item.desc}
            onChange={(e) => updatePersonalityItem(idx, 'desc', e.target.value)}
          />
          <button
            className="item-remove"
            style={{ marginTop: 8 }}
            onClick={() => removePersonalityItem(idx)}
          >
            삭제
          </button>
        </div>
      ))}
      <button className="add-link" onClick={addPersonalityItem} disabled={personality.length >= 3}>
        + 성격 추가
      </button>

      <label style={{ marginTop: 22 }}>
        좋아하는 것 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(최대 4개, 선택)</span>
      </label>
      {favorites.map((item, idx) => (
        <div className="portfolio-item" key={idx}>
          <input
            type="text"
            placeholder="이름 (예: 스케치)"
            style={{ marginBottom: 8 }}
            value={item.title}
            onChange={(e) => updateFavoriteItem(idx, 'title', e.target.value)}
          />
          <textarea
            placeholder="한 줄 설명"
            value={item.desc}
            onChange={(e) => updateFavoriteItem(idx, 'desc', e.target.value)}
          />
          <button
            className="item-remove"
            style={{ marginTop: 8 }}
            onClick={() => removeFavoriteItem(idx)}
          >
            삭제
          </button>
        </div>
      ))}
      <button className="add-link" onClick={addFavoriteItem} disabled={favorites.length >= 4}>
        + 좋아하는 것 추가
      </button>

      <label style={{ marginTop: 22 }}>
        한 줄 소개 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(선택)</span>
      </label>
      <div className="hint" style={{ marginTop: 0, marginBottom: 8 }}>
        이름·성격·관심사를 바탕으로 AI가 소개 문구를 만들어 드려요. 비워두면 발급 시 자동으로 채워집니다.
      </div>
      {fields.intro && (
        <div className="url-box" style={{ maxWidth: 'none', marginTop: 0, marginBottom: 10 }}>
          {fields.intro}
        </div>
      )}
      <button className="ghost" style={{ width: '100%' }} disabled={introGenerating} onClick={generateIntro}>
        {introGenerating ? '생성 중...' : fields.intro ? 'AI로 다시 생성하기' : 'AI로 한 줄 생성하기'}
      </button>
      {introError && (
        <div className="hint" style={{ color: 'var(--amber)' }}>
          {introError}
        </div>
      )}

      <div className="nav-row">
        <button className="ghost" onClick={() => goStep(step - 1)}>
          이전
        </button>
        <button className="primary" onClick={() => goStep(step + 1)}>
          다음
        </button>
      </div>
    </div>
  );
}
