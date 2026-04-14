import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatorView from './views/CreatorView';
import DisplayView from './views/DisplayView';
import AdminView from './views/AdminView';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CreatorView />} />
          <Route path="/create" element={<CreatorView />} />
          <Route path="/display" element={<DisplayView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
