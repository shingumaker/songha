import { CardProvider } from './context/CardContext';
import Stepper from './components/Stepper';
import Step1Template from './components/Step1Template';
import Step2Info from './components/Step2Info';
import Step3Photo from './components/Step3Photo';
import Step4Done from './components/Step4Done';
import BadgePreview from './components/BadgePreview';
import './App.css';

function BoothFlow() {
  return (
    <div className="app">
      <div>
        <div className="eyebrow">창의융합혁신센터 · EXPO 2026</div>
        <h1 className="title">즉석 디지털 프로필 만들기</h1>

        <Stepper />

        <Step1Template />
        <Step2Info />
        <Step3Photo />
        <Step4Done />
      </div>

      <BadgePreview />
    </div>
  );
}

export default function App() {
  return (
    <CardProvider>
      <BoothFlow />
    </CardProvider>
  );
}
