import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';
import { exportCardAsImage } from '../lib/exportCardImage';
import InfographicRenderer from '../components/infographics/InfographicRenderer';
import { STYLE_BACKGROUNDS, DEFAULT_PAGE_BG } from '../components/infographics/styleBackgrounds';

const LOAD_TIMEOUT_MS = 15000;
const EDIT_KEY_PREFIX = 'songha_edit_';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function CardView() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading');
  const [card, setCard] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setCard(null);
    setCanEdit(false);

    withTimeout(getDoc(doc(db, 'cards', id)), LOAD_TIMEOUT_MS)
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data();
          setCard(data);
          setStatus('ready');
          try {
            const key = localStorage.getItem(EDIT_KEY_PREFIX + id);
            if (key && data.editKey && key === data.editKey) setCanEdit(true);
          } catch {
            // ignore — edit link just stays hidden
          }
        } else {
          setStatus('not-found');
        }
      })
      .catch((err) => {
        console.error('카드 조회 실패:', err);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const saveAsImage = async () => {
    setSaving(true);
    try {
      await exportCardAsImage(cardRef.current, card?.style, `profile-card-${id}.png`);
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    } finally {
      setSaving(false);
    }
  };

  const theme = (card && STYLE_BACKGROUNDS[card.style]) || DEFAULT_PAGE_BG;
  const subTextColor = theme.dark ? 'rgba(255,255,255,0.65)' : 'var(--slate)';
  const linkColor = theme.dark ? 'rgba(255,255,255,0.92)' : 'var(--ink)';

  return (
    <div className="card-view-page" style={{ background: theme.background }}>
      <div className="card-view-inner">
        <div className="preview-label">디지털 프로필</div>

        {status === 'loading' && (
          <div className="status-line" style={{ color: subTextColor }}>
            불러오는 중...
          </div>
        )}

        {status === 'not-found' && (
          <div className="card-view-message" style={{ color: subTextColor }}>
            <p>존재하지 않는 프로필입니다.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="card-view-message" style={{ color: subTextColor }}>
            <p>
              프로필을 불러오지 못했습니다.
              <br />
              네트워크 연결을 확인한 뒤 다시 시도해 주세요.
            </p>
          </div>
        )}

        {status === 'ready' && card && (
          <>
            <div ref={cardRef} style={{ width: '100%' }}>
              <InfographicRenderer card={card} />
            </div>
            <button className="ghost" style={{ width: '100%', marginTop: 14 }} onClick={saveAsImage} disabled={saving}>
              {saving ? '저장 중...' : '이미지로 저장'}
            </button>
            {canEdit && (
              <Link className="ghost" style={{ display: 'block', width: '100%', marginTop: 10, boxSizing: 'border-box' }} to={`/card/${id}/edit`}>
                수정하기
              </Link>
            )}
          </>
        )}

        <Link className="back-link" style={{ color: linkColor }} to="/">
          새 프로필 만들기 →
        </Link>
      </div>
    </div>
  );
}
