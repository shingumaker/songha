import { Route, Routes } from 'react-router-dom';
import Booth from './pages/Booth';
import CardView from './pages/CardView';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Booth />} />
      <Route path="/card/:id" element={<CardView />} />
    </Routes>
  );
}
