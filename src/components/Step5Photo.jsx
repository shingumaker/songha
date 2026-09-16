import { useRef, useState } from 'react';
import { useCard } from '../context/CardContext';

const MODES = [
  { key: 'upload', label: '사진 업로드' },
  { key: 'icon', label: '기본 아이콘 선택' },
  { key: 'ai', label: 'AI 이미지 생성' },
];

export default function Step5Photo() {
  const {
    step,
    photoPreview,
    handlePhotoFile,
    avatarIcon,
    selectAvatarIcon,
    avatarIconOptions,
    consent,
    setConsent,
    issuing,
    issueCard,
    goStep,
  } = useCard();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(avatarIcon ? 'icon' : 'upload');

  return (
    <div className={`panel${step === 5 ? ' active' : ''}`}>
      <label>프로필 사진</label>

      <div className="tpl-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 14 }}>
        {MODES.map((m) => (
          <div
            key={m.key}
            className={`tpl-card${mode === m.key ? ' selected' : ''}`}
            style={{ padding: '10px 8px', textAlign: 'center' }}
            onClick={() => setMode(m.key)}
          >
            <div className="n" style={{ fontSize: 12 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {mode === 'upload' && (
        <>
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
        </>
      )}

      {mode === 'icon' && (
        <div className="tpl-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {avatarIconOptions.map((icon) => (
            <div
              key={icon}
              className={`tpl-card${avatarIcon === icon ? ' selected' : ''}`}
              style={{ padding: '14px 0', textAlign: 'center', fontSize: 26 }}
              onClick={() => selectAvatarIcon(icon)}
            >
              {icon}
            </div>
          ))}
        </div>
      )}

      {mode === 'ai' && (
        <div className="hint" style={{ marginTop: 0 }}>
          AI 이미지 생성은 준비 중이에요. 연동되면 여기서 좋아하는 것·특기를 바탕으로 이미지를
          만들어 드릴게요. 지금은 사진 업로드나 기본 아이콘으로 진행해 주세요.
        </div>
      )}

      <div className="hint">
        입력한 정보는 발급된 프로필 페이지에만 사용됩니다.
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
        <button className="ghost" onClick={() => goStep(4)}>
          이전
        </button>
        <button className="primary" disabled={!consent || issuing} onClick={issueCard}>
          {issuing ? '발급 중...' : '카드 발급하기'}
        </button>
      </div>
    </div>
  );
}
