import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import InfographicRenderer from '../components/infographics/InfographicRenderer';

export default function CardView() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading');
  const [card, setCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setCard(null);

    getDoc(doc(db, 'cards', id))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setCard(snap.data());
          setStatus('ready');
        } else {
          setStatus('not-found');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="app card-page">
      <div className="preview-wrap">
        <div className="preview-label">디지털 프로필</div>

        {status === 'loading' && <div className="status-line">불러오는 중...</div>}

        {status === 'not-found' && (
          <div className="card-view-message">
            <p>존재하지 않는 프로필입니다.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="card-view-message">
            <p>
              프로필을 불러오지 못했습니다.
              <br />
              네트워크 연결을 확인한 뒤 다시 시도해 주세요.
            </p>
          </div>
        )}

        {status === 'ready' && card && <InfographicRenderer card={card} />}

        <Link className="back-link" to="/">
          새 프로필 만들기 →
        </Link>
      </div>
    </div>
  );
}
