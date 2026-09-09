import { useCard } from '../context/CardContext';

const STEPS = [
  '1 · 유형선택',
  '2 · 정보입력',
  '3 · 성격·취향',
  '4 · 스타일',
  '5 · 사진',
  '6 · 발급',
];

export default function Stepper() {
  const { step } = useCard();

  return (
    <div className="steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const cls = ['step-pill'];
        if (n === step) cls.push('active');
        if (n < step) cls.push('done');
        return (
          <div key={n} className={cls.join(' ')}>
            {label}
          </div>
        );
      })}
    </div>
  );
}
