import { useCard, STEP_LABELS } from '../context/CardContext';

export default function Stepper() {
  const { step, stepSequence } = useCard();

  return (
    <div className="steps">
      {stepSequence.map((name, i) => {
        const n = i + 1;
        const cls = ['step-pill'];
        if (n === step) cls.push('active');
        if (n < step) cls.push('done');
        return (
          <div key={name} className={cls.join(' ')}>
            {n} · {STEP_LABELS[name]}
          </div>
        );
      })}
    </div>
  );
}
