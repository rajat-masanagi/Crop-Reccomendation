import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import SoilHealthDashboard from './components/SoilHealthDashboard';
import CropRecommendationDashboard from './components/CropRecommendationDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<SoilHealthDashboard />} />
        <Route path="/market" element={<CropRecommendationDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
