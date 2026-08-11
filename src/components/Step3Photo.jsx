import { useRef } from 'react';
import { useCard } from '../context/CardContext';

export default function Step3Photo() {
  const { step, photoPreview, handlePhotoFile, consent, setConsent, issuing, issueCard, goStep } =
    useCard();
  const fileInputRef = useRef(null);

  return (
    <div className={`panel${step === 3 ? ' active' : ''}`}>
      <label>프로필 사진</label>
      <div className="photo-drop" onClick={() => fileInputRef.current?.click()}>
        {photoPreview ? (
          <>
            <img src={photoPreview} alt="프로필 미리보기" />
            <span>다시 선택</span>
          </>
        ) : (
          <div>
            <div style={{ fontSize: 20, marginBottom: 6 }}>＋</div>
            사진을 업로드하세요 (선택)
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handlePhotoFile(e.target.files[0])}
      />
      <div className="hint">
        촬영 사진은 미리보기에만 사용되며, 실제 운영 시 이 자리에서 AI 스타일 변환 API가
        연결됩니다.
      </div>

      <div className="consent">
        <input
          type="checkbox"
          id="f-consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <label
          style={{ display: 'inline', fontFamily: "'Inter',sans-serif", color: 'var(--slate)', margin: 0 }}
          htmlFor="f-consent"
        >
          입력한 정보와 사진이 프로필 페이지 생성 및 센터 소식 안내에 활용되는 것에 동의합니다.
        </label>
      </div>

      <div className="nav-row">
        <button className="ghost" onClick={() => goStep(2)}>
          이전
        </button>
        <button className="primary" disabled={!consent || issuing} onClick={issueCard}>
          {issuing ? '발급 중...' : '카드 발급하기'}
        </button>
      </div>
    </div>
  );
}
