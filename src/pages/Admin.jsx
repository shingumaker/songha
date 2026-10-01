import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';

const ADMIN_PASSWORD = '1241';
const SESSION_KEY = 'songha_admin_unlocked';

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [status, setStatus] = useState('idle');
  const [cards, setCards] = useState([]);

  const unlock = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPasswordError('');
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // ignore — worst case the password prompt reappears next visit
      }
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.');
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setStatus('loading');
    getDocs(collection(db, 'cards'))
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCards(list);
        setStatus('ready');
      })
      .catch((err) => {
        console.error('프로필 목록 조회 실패:', err);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="app card-page">
        <div className="preview-wrap" style={{ width: '100%', maxWidth: 360 }}>
          <div className="preview-label">관리자 페이지</div>
          <form onSubmit={unlock}>
            <label>비밀번호</label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
            {passwordError && (
              <div className="hint" style={{ color: 'var(--amber)' }}>
                {passwordError}
              </div>
            )}
            <button type="submit" className="primary" style={{ width: '100%', marginTop: 14 }}>
              입장
            </button>
          </form>
          <Link className="back-link" to="/" style={{ marginTop: 16, display: 'inline-block' }}>
            ← 홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app card-page" style={{ maxWidth: 680 }}>
      <div className="preview-wrap" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="preview-label" style={{ margin: 0 }}>
            생성된 프로필 목록 ({cards.length})
          </div>
          <Link className="ghost" to="/" style={{ fontSize: 12, padding: '6px 12px' }}>
            홈으로
          </Link>
        </div>

        {status === 'loading' && <div className="status-line">불러오는 중...</div>}
        {status === 'error' && <div className="status-line">목록을 불러오지 못했습니다.</div>}
        {status === 'ready' && cards.length === 0 && (
          <div className="status-line">아직 생성된 프로필이 없습니다.</div>
        )}

        {status === 'ready' && cards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cards.map((c) => (
              <a
                key={c.id}
                href={`/card/${c.id}`}
                target="_blank"
                rel="noreferrer"
                className="portfolio-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name || '(이름 없음)'}</div>
                  <div className="hint" style={{ marginTop: 2 }}>
                    {[c.org, c.role].filter(Boolean).join(' · ') || ' '} · {c.style || '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="hint" style={{ margin: 0 }}>
                    {formatDate(c.createdAt)}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--lime)' }}>
                    /card/{c.id} →
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
