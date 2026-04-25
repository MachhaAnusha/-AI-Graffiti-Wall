import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import CreatorView from './views/CreatorView';
import DisplayView from './views/DisplayView';
import AdminView from './views/AdminView';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App min-h-screen relative">
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<CreatorView />} />
            <Route path="/create" element={<CreatorView />} />
            <Route path="/display" element={<DisplayView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
