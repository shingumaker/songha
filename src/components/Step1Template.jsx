import { useCard } from '../context/CardContext';

const TEMPLATES = [
  { id: 'business', k: 'TYPE 01', n: '명함형', d: '이름 · 소속 · 연락처 중심. 빠른 네트워킹용.' },
  { id: 'profile', k: 'TYPE 02', n: '프로필형', d: '한줄소개 + 관심분야. 학생·참관객 추천.' },
  { id: 'portfolio', k: 'TYPE 03', n: '포트폴리오형', d: '프로젝트 카드 포함. 창업가·개발자용.' },
];

export default function Step1Template() {
  const { step, template, selectTemplate, goStep } = useCard();

  return (
    <div className={`panel${step === 1 ? ' active' : ''}`}>
      <div className="tpl-grid">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className={`tpl-card${template === t.id ? ' selected' : ''}`}
            onClick={() => selectTemplate(t.id)}
          >
            <div className="k">{t.k}</div>
            <div className="n">{t.n}</div>
            <div className="d">{t.d}</div>
          </div>
        ))}
      </div>
      <div className="hint">체험 시간은 유형에 따라 1~3분 정도 소요됩니다.</div>
      <div className="nav-row">
        <span></span>
        <button className="primary" disabled={!template} onClick={() => goStep(2)}>
          다음
        </button>
      </div>
    </div>
  );
}
