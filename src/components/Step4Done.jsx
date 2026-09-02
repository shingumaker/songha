import { useCard } from '../context/CardContext';

export default function Step4Done() {
  const { step, issuedCard, resetFlow } = useCard();

  return (
    <div className={`panel${step === 4 ? ' active' : ''}`}>
      <div className="done-screen">
        <div className="big-check">✓</div>
        <h2>프로필이 생성되었습니다</h2>
        <p>
          오른쪽 카드를 확인하고, 안내에 따라 NFC 카드에 태깅해 주세요.
          <br />이 링크는 태깅된 카드를 통해 계속 열람할 수 있습니다.
        </p>
        <div className="nav-row" style={{ justifyContent: 'center', marginTop: 0 }}>
          {issuedCard && (
            <a className="ghost" href={`/card/${issuedCard.id}`} target="_blank" rel="noreferrer">
              발급된 프로필 페이지 열기
            </a>
          )}
          <button className="ghost" onClick={resetFlow}>
            새로운 프로필 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
