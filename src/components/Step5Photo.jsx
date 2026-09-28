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
    currentStepName,
    photoPreview,
    handlePhotoFile,
    avatarIcon,
    selectAvatarIcon,
    setAiPhoto,
    avatarIconOptions,
    consent,
    setConsent,
    issuing,
    issueCard,
    goStep,
  } = useCard();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(avatarIcon ? 'icon' : 'upload');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const generateAiImage = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '이미지 생성에 실패했습니다.');
      setAiPhoto(data.image);
    } catch (err) {
      console.error('AI 이미지 생성 실패:', err);
      setAiError(err.message || '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className={`panel${currentStepName === 'photo' ? ' active' : ''}`}>
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
        <div>
          <textarea
            rows={3}
            placeholder="예: 안경 쓴 웃는 얼굴의 메이커, 파란 후드티"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <div className="hint" style={{ marginTop: 6 }}>
            원하는 모습을 짧게 설명하면 AI가 프로필 아이콘을 만들어 드려요. 생성에 몇 초 정도 걸립니다.
          </div>
          <button
            className="ghost"
            style={{ width: '100%', marginTop: 10 }}
            disabled={!aiPrompt.trim() || aiGenerating}
            onClick={generateAiImage}
          >
            {aiGenerating ? '생성 중...' : '이미지 생성하기'}
          </button>
          {aiError && (
            <div className="hint" style={{ color: 'var(--amber)' }}>
              {aiError}
            </div>
          )}
          {photoPreview && (
            <div className="photo-drop" style={{ marginTop: 10 }}>
              <img src={photoPreview} alt="생성된 프로필 미리보기" />
            </div>
          )}
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
        <button className="ghost" onClick={() => goStep(step - 1)}>
          이전
        </button>
        <button className="primary" disabled={!consent || issuing} onClick={issueCard}>
          {issuing ? '발급 중...' : '카드 발급하기'}
        </button>
      </div>
    </div>
  );
}
