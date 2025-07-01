import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ForecastPage from './pages/ForecastPage';
import HistoryPage from './pages/HistoryPage';
import AIAssistantPage from './pages/AIAssistantPage';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <Header appName={APP_NAME} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/assistant" element={<AIAssistantPage />} />
        </Routes>
      </main>
      <Footer appName={APP_NAME} />
    </div>
  );
};

export default App;