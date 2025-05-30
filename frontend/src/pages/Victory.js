import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Victory() {
  const navigate = useNavigate();
  const victoryAudio = useRef(null);

  useEffect(() => {
    if (victoryAudio.current) {
      victoryAudio.current.currentTime = 0;
      victoryAudio.current.play();
    }
  }, []);

  return (
    <div className="escape-room-bg">
      <audio ref={victoryAudio} src="/victory.mp3" preload="auto" />
      <div className="room-card">
        <h1 className="magic-title" style={{ fontSize: '2.5rem' }}>🎉 You Escaped!</h1>
        <img className="room-image victory-anim" src="/door-exit-open.png" alt="Victory!" />
        <p style={{ color: '#fff', fontSize: '1.2rem', margin: '1.5rem 0' }}>
          Congratulations, you solved all the puzzles and escaped the room!
        </p>
        <button onClick={() => navigate('/')}>Play Again</button>
      </div>
    </div>
  );
}

export default Victory; 