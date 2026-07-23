import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlassCursor from './components/GlassCursor';
import Shell from './components/Shell';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Sentiment from './pages/Sentiment';
import CompanyAnalysis from './pages/CompanyAnalysis';
import Screener from './pages/Screener';
import Economics from './pages/Economics';
import AIInsights from './pages/AIInsights';
import Predictions from './pages/Predictions';
import Portfolio from './pages/Portfolio';
import Auth from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <GlassCursor />
      <Shell>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/news"      element={<News />} />
          <Route path="/sentiment" element={<Sentiment />} />
          <Route path="/company"   element={<CompanyAnalysis />} />
          <Route path="/screener"  element={<Screener />} />
          <Route path="/economics" element={<Economics />} />
          <Route path="/ai"        element={<AIInsights />} />
          <Route path="/predict"   element={<Predictions />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/auth"      element={<Auth />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
