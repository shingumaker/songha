import { Link } from 'react-router-dom';
import { CardProvider } from '../context/CardContext';
import Stepper from '../components/Stepper';
import Step1Template from '../components/Step1Template';
import Step2Info from '../components/Step2Info';
import Step3PersonalityFavorites from '../components/Step3PersonalityFavorites';
import Step4StyleSelect from '../components/Step4StyleSelect';
import Step5Photo from '../components/Step5Photo';
import Step6Done from '../components/Step6Done';
import LivePreview from '../components/LivePreview';

function CardDesignFlow() {
  return (
    <div className="app">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">창의융합혁신센터 · EXPO 2026</div>
            <h1 className="title">ID 카드 디자인 만들기</h1>
          </div>
          <Link className="ghost" to="/" style={{ flexShrink: 0, fontSize: 13, padding: '8px 14px' }}>
            ← 프로필 만들기로
          </Link>
        </div>

        <Stepper />

        <Step1Template />
        <Step2Info />
        <Step3PersonalityFavorites />
        <Step4StyleSelect />
        <Step5Photo />
        <Step6Done />
      </div>

      <LivePreview />
    </div>
  );
}

export default function CardDesignBooth() {
  return (
    <CardProvider mode="card">
      <CardDesignFlow />
    </CardProvider>
  );
}
