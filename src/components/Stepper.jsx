import { useCard, STEP_LABELS } from '../context/CardContext';

export default function Stepper() {
  const { step, stepSequence } = useCard();

  return (
    <div className="steps">
      <div className="steps-track">
        {stepSequence.map((name, i) => {
          const n = i + 1;
          const cls = ['step-dot'];
          if (n === step) cls.push('active');
          if (n < step) cls.push('done');
          return <div key={name} className={cls.join(' ')} />;
        })}
      </div>
      <div className="steps-label">
        <span className="n">
          {step}/{stepSequence.length}
        </span>{' '}
        · {STEP_LABELS[stepSequence[step - 1]]}
      </div>
    </div>
  );
}
