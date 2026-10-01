import { useCard } from '../context/CardContext';
import { STYLE_META } from '../context/CardContext';

export default function Step4StyleSelect() {
  const { step, currentStepName, style, selectStyle, goStep, styleKeys } = useCard();

  return (
    <div className={`panel${currentStepName === 'style' ? ' active' : ''}`}>
      <div className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
        발급될 인포그래픽 카드의 디자인을 골라주세요.
      </div>
      <div className="tpl-grid">
        {styleKeys.map((key) => (
          <div
            key={key}
            className={`tpl-card${style === key ? ' selected' : ''}`}
            onClick={() => selectStyle(key)}
          >
            <div className="n" style={{ fontSize: 13 }}>
              {STYLE_META[key].label}
            </div>
            <div className="d">{STYLE_META[key].hint}</div>
          </div>
        ))}
        <div
          className={`tpl-card${style && !styleKeys.includes(style) ? ' selected' : ''}`}
          onClick={() => selectStyle('random')}
        >
          <div className="n" style={{ fontSize: 13, color: 'var(--lime)' }}>
            🎲 랜덤으로 뽑기
          </div>
          <div className="d">{styleKeys.length}가지 중 하나가 무작위로 정해져요.</div>
        </div>
      </div>

      <div className="nav-row">
        {step > 1 ? (
          <button className="ghost" onClick={() => goStep(step - 1)}>
            이전
          </button>
        ) : (
          <span></span>
        )}
        <button className="primary" disabled={!style} onClick={() => goStep(step + 1)}>
          다음
        </button>
      </div>
    </div>
  );
}
