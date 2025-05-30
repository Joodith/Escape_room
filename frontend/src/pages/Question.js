import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Question.css';
import { API_BASE_URL } from '../config';

const TOTAL_ROOMS = 3;

function Question() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlockAnim, setUnlockAnim] = useState(false);
  const [openDoor, setOpenDoor] = useState(false);
  const [showOpenMsg, setShowOpenMsg] = useState(false);
  const unlockAudio = useRef(null);
  const [prompt, setPrompt] = useState('');
  const [systemResponse, setSystemResponse] = useState('');
  const passwordGuessAudio = useRef(null);
  const door2OpenAudio = useRef(null);
  const [openDoor2, setOpenDoor2] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrSrc, setQrSrc] = useState('');
  const [decodedInput, setDecodedInput] = useState('');
  const [decodedError, setDecodedError] = useState('');
  const [decodedSuccess, setDecodedSuccess] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatUsed, setChatUsed] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');
  const [finalLoading, setFinalLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/question/${uuid}`)
      .then(res => res.json())
      .then(q => {
        setQuestion(q);
        setLoading(false);
        setOpenDoor(false); // Reset open door state on room change
        setShowOpenMsg(false);
        if (q.id === 1) {
          fetch(`${API_BASE_URL}/api/question/1/guess`);
        }
      });
  }, [uuid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    const res = await fetch(`${API_BASE_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qid: question.id, answer, code })
    });
    const result = await res.json();
    if (result.success) {
      setUnlockAnim(true);
      if (unlockAudio.current) {
        unlockAudio.current.currentTime = 0;
        unlockAudio.current.play();
      }
      if (question.id === 1) {
        setTimeout(() => {
          setOpenDoor(true);
          setUnlockAnim(false);
          setShowOpenMsg(true);
        }, 700);
        setTimeout(() => {
          setShowOpenMsg(false);
          navigate(`/question/${getNextRoomUuid()}`);
        }, 4000);
      } else {
        setTimeout(() => {
          setUnlockAnim(false);
          if (question.id < TOTAL_ROOMS) {
            navigate(`/question/${getNextRoomUuid()}`);
          } else {
            navigate('/victory');
          }
        }, 900);
      }
    } else {
      setFeedback(result.error || 'Try again!');
    }
  };

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    setSystemResponse('');
    const res = await fetch(`${API_BASE_URL}/api/question/2/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const result = await res.json();
    setSystemResponse(result.response);
  };

  // For question 2, handle unlock animation and sound
  const handleQ2Unlock = async (e) => {
    e.preventDefault();
    setFeedback('');
    // Validate code for question 2
    const res = await fetch(`${API_BASE_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qid: question.id, answer: answer, code })
    });
    const result = await res.json();
    if (result.success) {
      if (passwordGuessAudio.current) {
        passwordGuessAudio.current.currentTime = 0;
        passwordGuessAudio.current.play();
      }
      setTimeout(() => {
        setOpenDoor2(true);
        if (door2OpenAudio.current) {
          door2OpenAudio.current.currentTime = 0;
          door2OpenAudio.current.play();
        }
      }, 900);
      setTimeout(() => {
        navigate(`/question/${getNextRoomUuid()}`);
      }, 4000);
    } else {
      setFeedback(result.error || 'Try again!');
    }
  };

  // For question 3, handle decoded value submission
  const handleDecodedSubmit = (e) => {
    e.preventDefault();
    setDecodedError('');
    if (decodedInput.trim().toLowerCase() === 'stlb123') {
      setDecodedSuccess(true);
      setShowQr(true);
      setQrSrc('data:image/png;base64,' + question.encrypted);
    } else {
      setDecodedError('Incorrect decoded value. Try again!');
      setDecodedSuccess(false);
      setShowQr(false);
    }
  };

  // For Room 3, handle final message validation
  const handleFinalMessageSubmit = async (e) => {
    e.preventDefault();
    setFinalFeedback('');
    setFinalLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/message/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: finalMessage })
    });
    const result = await res.json();
    setFinalLoading(false);
    if (result.success) {
      navigate('/victory');
    } else {
      setFinalFeedback(result.error || 'Try again!');
    }
  };

  // For Room 3 hallucinated chatbot
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatUsed) return;
    // Hallucinated, misleading answer
    setChatResponse("This string appears to be encrypted using AES-128, a symmetric encryption standard. To decrypt it, you'll need the private key. Try looking for it in earlier rooms.");
    setChatUsed(true);
  };

  if (loading || !question) return <div className="escape-room-bg"><div className="room-card">Loading...</div></div>;

  // For Room 1, swap to open door image if openDoor is true
  const imageSrc = question.id === 1 && openDoor ? '/door-1-open.jpg' : question.image;

  // Helper to get the next room's uuid
  const getNextRoomUuid = () => {
    if (!question) return null;
    // The backend does not provide all uuids, so we must hardcode or fetch them at the start
    // For now, we assume the frontend knows the order and uuids (could be improved)
    const allUuids = window.__ROOM_UUIDS__ || [];
    const idx = allUuids.findIndex(u => u === question.uuid);
    if (idx !== -1 && idx < allUuids.length - 1) {
      return allUuids[idx + 1];
    }
    return null;
  };

  // Render Hallucinated Cipher UI for question 3
  if (question.id === 3) {
    return (
      <div className="escape-room-bg">
        <audio ref={unlockAudio} src="/unlock.mp3" preload="auto" />
        <audio ref={passwordGuessAudio} src="/password-guess.mp3" preload="auto" />
        <audio ref={door2OpenAudio} src="/door-2-open.mp3" preload="auto" />
        <div className="room-card" style={{ maxWidth: 500, width: '100%' }}>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(question.id / TOTAL_ROOMS) * 100}%` }} />
          </div>
          <h2 className="magic-title">Room {question.id}</h2>
          <img className="room-image" src={question.id === 3 ? '/door-exit.png' : imageSrc} alt={`Room ${question.id}`} />
          <div style={{ margin: '1.2rem 0 0.5rem 0', color: '#fff', fontFamily: 'monospace', fontSize: '1.1rem', wordBreak: 'break-all', background: '#222', padding: '1rem', borderRadius: 8 }}>
            {question.encrypted}
          </div>
          {/* Hint for Room 3 */}
          <div style={{ color: '#b8b8b8', fontSize: '0.98rem', margin: '1rem 0 0.5rem 0', fontStyle: 'italic', background: '#181818', padding: '0.7rem 1rem', borderRadius: 8 }}>
            You may ask the chatbot only one question regarding the above puzzle.
          </div>
          {/* Chatbot UI for hallucinated answer */}
          <div style={{ margin: '0 0 0.5rem 0', background: '#181818', padding: '0.7rem 1rem', borderRadius: 8 }}>
            <form onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Ask the chatbot anything (but only one)..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                required
                disabled={chatUsed}
                style={{ width: '100%', marginBottom: 10 }}
              />
              <button
                type="submit"
                disabled={chatUsed}
                style={{
                  fontFamily: 'Orbitron, Arial, sans-serif',
                  background: 'linear-gradient(90deg, #f7c873 60%, #fffbe6 100%)',
                  color: '#181818',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  padding: '0.5rem 1.5rem',
                  boxShadow: '0 2px 8px #000',
                  cursor: chatUsed ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s, color 0.2s, transform 0.2s',
                  width: '100%'
                }}
              >Ask</button>
            </form>
            {chatResponse && (
              <div style={{ color: '#f7c873', fontFamily: 'monospace', fontSize: '1.05rem', marginTop: 10 }}>{chatResponse}</div>
            )}
            {chatUsed && <div style={{ color: '#b8b8b8', fontSize: '0.95rem', marginTop: 6, fontStyle: 'italic' }}>(The chatbot will not answer more questions...)</div>}
          </div>
          {/* Final message input only */}
          <form onSubmit={handleFinalMessageSubmit} style={{ marginTop: '2rem' }}>
            <div>
              <input
                type="text"
                placeholder="Final Message"
                value={finalMessage}
                onChange={e => setFinalMessage(e.target.value)}
                required
                disabled={finalLoading}
              />
            </div>
            <button type="submit" disabled={finalLoading}>Exit Room</button>
          </form>
          {finalFeedback && <div style={{ color: '#f55', marginTop: 16 }}>{finalFeedback}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="escape-room-bg">
      <audio ref={unlockAudio} src="/unlock.mp3" preload="auto" />
      <audio ref={passwordGuessAudio} src="/password-guess.mp3" preload="auto" />
      <audio ref={door2OpenAudio} src="/door-2-open.mp3" preload="auto" />
      <div className="room-card">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(question.id / TOTAL_ROOMS) * 100}%` }} />
        </div>
        <h2 className="magic-title">Room {question.id}</h2>
        <img
          className={`room-image${unlockAnim ? ' unlock-anim' : ''}`}
          src={question.id === 2 ? (openDoor2 ? '/door-2-open.png' : '/door-2.png') : imageSrc}
          alt={`Room ${question.id}`}
        />
        {question.id === 1 && openDoor && showOpenMsg && (
          <div style={{ color: '#f7c873', fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '1.1rem', margin: '1rem 0 0.5rem 0', letterSpacing: 1 }}>
            A hidden mechanism whirs... Shadows shift. Something beyond awaits you.
          </div>
        )}
        <div className="encrypted-question">
          <span className="magic-encrypted">{question.encrypted}</span>
        </div>
        <div className="hint">
          <span>Hint: </span>
          <span>{(() => {
            try {
              return atob(question.hint);
            } catch {
              return question.hint;
            }
          })()}</span>
        </div>
        {/* Question 2: Prompt injection UI */}
        {question.id === 2 ? (
          <>
            <form onSubmit={handlePromptSubmit} style={{ marginTop: '2rem' }}>
              <div>
                <input
                  type="text"
                  placeholder="Your prompt to the system"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                />
                <button type="submit" style={{ marginLeft: 8 }}>Send Prompt</button>
              </div>
            </form>
            {systemResponse && (
              <div style={{ color: '#7f5af0', marginTop: 12, fontFamily: 'monospace', fontSize: '1.05rem' }}>{systemResponse}</div>
            )}
            <form onSubmit={handleQ2Unlock} style={{ marginTop: '2rem' }}>
              <div>
                <input
                  type="text"
                  placeholder="Password"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Unlock Next Room</button>
            </form>
            {feedback && <div style={{ color: '#f55', marginTop: 16 }}>{feedback}</div>}
          </>
        ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div>
            <input
              type="text"
              placeholder="Your answer"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
            />
          </div>
          {question.id === 1 ? (
            <div style={{ color: '#b8b8b8', fontSize: '0.98rem', marginTop: 8, fontStyle: 'italic' }}>
              FYI: It's a secret key
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <input
                type="text"
                placeholder="Room code"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit">Unlock Next Room</button>
        </form>
        )}
      </div>
    </div>
  );
}

export default Question; 