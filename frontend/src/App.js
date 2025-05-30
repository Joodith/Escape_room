import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Question from './pages/Question';
import Victory from './pages/Victory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/question/:uuid" element={<Question />} />
        <Route path="/victory" element={<Victory />} />
      </Routes>
    </Router>
  );
}

export default App; 