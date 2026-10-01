import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';
import { CardProvider, CARD_STYLE_KEYS } from '../context/CardContext';
import Stepper from '../components/Stepper';
import Step1Template from '../components/Step1Template';
import Step2Info from '../components/Step2Info';
import Step3PersonalityFavorites from '../components/Step3PersonalityFavorites';
import Step4StyleSelect from '../components/Step4StyleSelect';
import Step5Photo from '../components/Step5Photo';
import Step6Done from '../components/Step6Done';
import LivePreview from '../components/LivePreview';

const EDIT_KEY_PREFIX = 'songha_edit_';

function EditFlow({ card }) {
  const mode = CARD_STYLE_KEYS.includes(card.style) ? 'card' : 'profile';

  return (
    <CardProvider mode={mode} initialCard={card}>
      <div className="app profile-page">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">창의융합혁신센터 · EXPO 2026</div>
              <h1 className="title">프로필 수정하기</h1>
            </div>
            <Link className="ghost" to={`/card/${card.id}`} style={{ flexShrink: 0, fontSize: 13, padding: '8px 14px' }}>
              ← 프로필로 돌아가기
            </Link>
          </div>

          <Stepper />

          {mode === 'profile' && <Step1Template />}
          <Step4StyleSelect />
          <Step2Info />
          <Step3PersonalityFavorites />
          <Step5Photo />
          <Step6Done />
        </div>

        <LivePreview />
      </div>
    </CardProvider>
  );
}

export default function EditCard() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading');
  const [card, setCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, 'cards', id))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setStatus('not-found');
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        let key = null;
        try {
          key = localStorage.getItem(EDIT_KEY_PREFIX + id);
        } catch {
          // ignore — treated the same as "no key"
        }
        if (key && data.editKey && key === data.editKey) {
          setCard(data);
          setStatus('ready');
        } else {
          setStatus('forbidden');
        }
      })
      .catch((err) => {
        console.error('프로필 조회 실패:', err);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === 'ready' && card) {
    return <EditFlow card={card} />;
  }

  const message = {
    loading: '불러오는 중...',
    'not-found': '존재하지 않는 프로필입니다.',
    forbidden: (
      <>
        이 기기에서는 이 프로필을 수정할 권한이 없습니다.
        <br />
        발급했던 그 브라우저·기기에서만 수정할 수 있어요.
      </>
    ),
    error: (
      <>
        프로필을 불러오지 못했습니다.
        <br />
        네트워크 연결을 확인한 뒤 다시 시도해 주세요.
      </>
    ),
  }[status];

  return (
    <div className="app card-page">
      <div className="preview-wrap">
        <div className="preview-label">프로필 수정</div>
        {status === 'loading' ? (
          <div className="status-line">{message}</div>
        ) : (
          <>
            <div className="card-view-message">{message}</div>
            <Link className="back-link" to={`/card/${id}`}>
              ← 프로필로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
