import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { collection, doc, getCountFromServer, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CardContext = createContext(null);

const TEMPLATE_COPY = {
  business: {
    tag: '명함형',
    introLabel: '한줄소개',
    introOptional: true,
    introPlaceholder: '(선택) 짧은 소개',
  },
  profile: {
    tag: '프로필형',
    introLabel: '한줄소개',
    introOptional: false,
    introPlaceholder: '아이디어를 현실로 만드는 사람',
  },
  portfolio: {
    tag: '포트폴리오형',
    introLabel: '한줄소개',
    introOptional: false,
    introPlaceholder: '문제를 발견하고 구조로 풀어내는 사람',
  },
};

const STYLE_META = {
  colorful: { label: '컬러 카드형', hint: '따뜻한 색감의 스케치 아이콘 카드' },
  minimal: { label: '미니멀 레주메형', hint: '흑백, 깔끔한 섹션 구분' },
  gamestat: { label: '게임 스탯형', hint: '다크 테마, 능력치 바 + 퀘스트' },
  scrapbook: { label: '스크랩북형', hint: '워시테이프와 손글씨 메모' },
  sparkle: { label: '글로시 스파클형', hint: '파스텔 그라디언트 + 별 장식' },
  browser: { label: '브라우저 창형', hint: '겹쳐진 앱 창 콜라주' },
  vintage: { label: '빈티지 여행증형', hint: '오래된 종이와 별 테두리' },
  neon: { label: '네온 픽셀형', hint: '다크 배경 + 네온 글로우' },
};

const STYLE_KEYS = Object.keys(STYLE_META);

function randomId() {
  return Math.random().toString(36).slice(2, 8);
}

function pickRandomStyle() {
  return STYLE_KEYS[Math.floor(Math.random() * STYLE_KEYS.length)];
}

const SAVE_TIMEOUT_MS = 15000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

const initialFields = {
  name: '',
  org: '',
  role: '',
  intro: '',
  contact: '',
};

export function CardProvider({ children }) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState(initialFields);
  const [links, setLinks] = useState(['']);
  const [portfolio, setPortfolio] = useState([]);
  const [personality, setPersonality] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [style, setStyle] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [consent, setConsent] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [statusLine, setStatusLine] = useState('');
  const [issuedCard, setIssuedCard] = useState(null);
  const [galleryCount, setGalleryCount] = useState(null);

  const selectTemplate = useCallback((t) => {
    setTemplate(t);
    if (t !== 'portfolio') setPortfolio([]);
  }, []);

  const updateField = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goStep = useCallback((n) => {
    setStep(n);
    setLinks((prev) => (prev.length === 0 ? [''] : prev));
  }, []);

  const addLink = useCallback(() => {
    setLinks((prev) => (prev.length >= 3 ? prev : [...prev, '']));
  }, []);

  const updateLink = useCallback((idx, value) => {
    setLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  }, []);

  const removeLink = useCallback((idx) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addPortfolioItem = useCallback(() => {
    setPortfolio((prev) => (prev.length >= 2 ? prev : [...prev, { title: '', desc: '' }]));
  }, []);

  const updatePortfolioItem = useCallback((idx, key, value) => {
    setPortfolio((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  }, []);

  const removePortfolioItem = useCallback((idx) => {
    setPortfolio((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addPersonalityItem = useCallback(() => {
    setPersonality((prev) => (prev.length >= 3 ? prev : [...prev, { title: '', desc: '' }]));
  }, []);

  const updatePersonalityItem = useCallback((idx, key, value) => {
    setPersonality((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  }, []);

  const removePersonalityItem = useCallback((idx) => {
    setPersonality((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addFavoriteItem = useCallback(() => {
    setFavorites((prev) => (prev.length >= 4 ? prev : [...prev, { title: '', desc: '' }]));
  }, []);

  const updateFavoriteItem = useCallback((idx, key, value) => {
    setFavorites((prev) => prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f)));
  }, []);

  const removeFavoriteItem = useCallback((idx) => {
    setFavorites((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const selectStyle = useCallback((s) => {
    setStyle(s === 'random' ? pickRandomStyle() : s);
  }, []);

  const handlePhotoFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 320;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        // Photos are stored inline on the Firestore card document (no Storage
        // bucket needed), so keep them well under Firestore's 1MiB field limit.
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const resetFlow = useCallback(() => {
    setStep(1);
    setTemplate(null);
    setFields(initialFields);
    setLinks(['']);
    setPortfolio([]);
    setPersonality([]);
    setFavorites([]);
    setStyle(null);
    setPhotoPreview(null);
    setConsent(false);
    setStatusLine('');
    setIssuedCard(null);
  }, []);

  const issueCard = useCallback(async () => {
    setIssuing(true);
    setStatusLine('카드 저장 중...');
    const id = randomId();
    const finalStyle = style || pickRandomStyle();

    const record = {
      id,
      template,
      style: finalStyle,
      name: fields.name.trim(),
      org: fields.org.trim(),
      role: fields.role.trim(),
      intro: fields.intro.trim(),
      contact: fields.contact.trim(),
      links: links.filter((l) => l && l.trim()),
      portfolio: portfolio.filter((p) => p.title),
      personality: personality.filter((p) => p.title),
      favorites: favorites.filter((f) => f.title),
      createdAt: Date.now(),
    };
    if (photoPreview) record.photo = photoPreview;

    try {
      await withTimeout(setDoc(doc(collection(db, 'cards'), id), record), SAVE_TIMEOUT_MS);

      try {
        const snap = await withTimeout(getCountFromServer(collection(db, 'cards')), SAVE_TIMEOUT_MS);
        setGalleryCount(snap.data().count);
      } catch {
        // count is a nice-to-have; ignore failures
      }

      setStatusLine('저장 완료');
    } catch (err) {
      console.error('카드 저장 실패:', err);
      setStatusLine('데모 모드로 진행 중 (저장 없이 미리보기만 제공)');
    }

    const url = `${window.location.origin}/card/${id}`;
    setIssuedCard({ id, url });
    setIssuing(false);
    goStep(6);
  }, [template, style, fields, links, portfolio, personality, favorites, photoPreview, goStep]);

  const value = useMemo(
    () => ({
      step,
      goStep,
      template,
      selectTemplate,
      templateCopy: template ? TEMPLATE_COPY[template] : null,
      fields,
      updateField,
      links,
      addLink,
      updateLink,
      removeLink,
      portfolio,
      addPortfolioItem,
      updatePortfolioItem,
      removePortfolioItem,
      personality,
      addPersonalityItem,
      updatePersonalityItem,
      removePersonalityItem,
      favorites,
      addFavoriteItem,
      updateFavoriteItem,
      removeFavoriteItem,
      style,
      selectStyle,
      photoPreview,
      handlePhotoFile,
      consent,
      setConsent,
      issuing,
      statusLine,
      issuedCard,
      galleryCount,
      issueCard,
      resetFlow,
    }),
    [
      step,
      goStep,
      template,
      selectTemplate,
      fields,
      updateField,
      links,
      addLink,
      updateLink,
      removeLink,
      portfolio,
      addPortfolioItem,
      updatePortfolioItem,
      removePortfolioItem,
      personality,
      addPersonalityItem,
      updatePersonalityItem,
      removePersonalityItem,
      favorites,
      addFavoriteItem,
      updateFavoriteItem,
      removeFavoriteItem,
      style,
      selectStyle,
      photoPreview,
      handlePhotoFile,
      consent,
      issuing,
      statusLine,
      issuedCard,
      galleryCount,
      issueCard,
      resetFlow,
    ],
  );

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCard() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCard must be used within a CardProvider');
  return ctx;
}

export { TEMPLATE_COPY, STYLE_META, STYLE_KEYS };
