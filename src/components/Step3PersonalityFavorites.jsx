import { useCard } from '../context/CardContext';

export default function Step3PersonalityFavorites() {
  const {
    step,
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

  return (
    <div className={`panel${step === 3 ? ' active' : ''}`}>
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

      <div className="nav-row">
        <button className="ghost" onClick={() => goStep(2)}>
          이전
        </button>
        <button className="primary" onClick={() => goStep(4)}>
          다음
        </button>
      </div>
    </div>
  );
}
