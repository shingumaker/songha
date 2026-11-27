import { Route, Routes } from 'react-router-dom';
import Booth from './pages/Booth';
import CardDesignBooth from './pages/CardDesignBooth';
import CardView from './pages/CardView';
import Admin from './pages/Admin';
import EditCard from './pages/EditCard';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Booth />} />
      <Route path="/card-design" element={<CardDesignBooth />} />
      <Route path="/card/:id" element={<CardView />} />
      <Route path="/card/:id/edit" element={<EditCard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
