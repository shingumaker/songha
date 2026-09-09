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

function randomId() {
  return Math.random().toString(36).slice(2, 8);
}

const SAVE_TIMEOUT_MS = 6000;

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
    setPhotoPreview(null);
    setConsent(false);
    setStatusLine('');
    setIssuedCard(null);
  }, []);

  const issueCard = useCallback(async () => {
    setIssuing(true);
    setStatusLine('카드 저장 중...');
    const id = randomId();

    const record = {
      id,
      template,
      name: fields.name.trim(),
      org: fields.org.trim(),
      role: fields.role.trim(),
      intro: fields.intro.trim(),
      contact: fields.contact.trim(),
      links: links.filter((l) => l && l.trim()),
      portfolio: portfolio.filter((p) => p.title),
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
    } catch {
      setStatusLine('데모 모드로 진행 중 (저장 없이 미리보기만 제공)');
    }

    const url = `${window.location.origin}/card/${id}`;
    setIssuedCard({ id, url });
    setIssuing(false);
    goStep(4);
  }, [template, fields, links, portfolio, photoPreview, goStep]);

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

export { TEMPLATE_COPY };
