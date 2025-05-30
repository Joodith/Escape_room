import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question.css';

function Landing() {
  const navigate = useNavigate();
  const [uuids, setUuids] = useState([]);

  useEffect(() => {
    // Fetch all question uuids from the backend (or hardcode for now)
    fetch('/api/all-question-uuids')
      .then(res => res.json())
      .then(data => {
        setUuids(data.uuids);
        window.__ROOM_UUIDS__ = data.uuids;
      });
  }, []);

  const handleStart = () => {
    if (uuids.length > 0) {
      navigate(`/question/${uuids[0]}`, { replace: true });
    }
  };

  return (
    <div className="escape-room-bg">
      <div className="room-card">
        <h1 className="magic-title">Escape Room Challenge</h1>
        <img className="room-image" src="/room1.jpg" alt="Escape Room" />
        <p style={{ color: '#fff', fontSize: '1.1rem', margin: '1.5rem 0' }}>
          Welcome to the Escape Room! Solve each cryptic puzzle, find the hidden code in the room, and unlock the next door. Can you escape?
        </p>
        <button onClick={handleStart}>Start Game</button>
      </div>
    </div>
  );
}

export default Landing; 