import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { askAIStream } from '../api/endpoints';

type Msg = { role: 'user' | 'ai'; text: string; streaming?: boolean };

const SUGGESTIONS = [
  'Who are you?',
  'I am new to investing',
  'Tell me about NVIDIA',
  'What is a P/E ratio?',
  'What is a dividend?',
  'Compare Apple and Microsoft',
  'What is inflation?',
  'Best dividend stocks?',
  'Explain market sentiment',
  'How do I build a portfolio?',
];

export default function AIInsights() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text: `Hello! I'm Onyilokwu — your AI financial guide.\n\n"Onyilokwu" is an Idoma name meaning "one who knows the way."\n\nAsk me anything about stocks, markets, or investing — explained clearly, no finance degree needed!\n\nI know about: AAPL, NVDA, TSLA, MSFT, JPM, JNJ, XOM, META — and all the key financial concepts.`,
    },
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text?: string) {
    const q = (text || input).trim();
    if (!q || typing) return;
    setInput('');

    // Add user message
    setMessages(m => [...m, { role: 'user', text: q }]);
    setTyping(true);

    // Add empty AI message that we'll stream into
    setMessages(m => [...m, { role: 'ai', text: '', streaming: true }]);

    try {
      await askAIStream(
        q,
        '',
        // onChunk — append each token to the last message
        (chunk) => {
          setMessages(m => {
            const updated = [...m];
            const last = updated[updated.length - 1];
            if (last.role === 'ai') {
              updated[updated.length - 1] = { ...last, text: last.text + chunk };
            }
            return updated;
          });
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        // onDone
        () => {
          setMessages(m => {
            const updated = [...m];
            const last = updated[updated.length - 1];
            if (last.role === 'ai') {
              updated[updated.length - 1] = { ...last, streaming: false };
            }
            return updated;
          });
          setTyping(false);
        },
      );
    } catch {
      setMessages(m => {
        const updated = [...m];
        const last = updated[updated.length - 1];
        if (last.role === 'ai') {
          updated[updated.length - 1] = {
            ...last,
            text: `Could not reach the AI server.\n\nMake sure the backend is running and DEEPSEEK_API_KEY is set in backend/.env\n\nGet a free key at: platform.deepseek.com`,
            streaming: false,
          };
        }
        return updated;
      });
      setTyping(false);
    }
  }

  return (
    <div>
      <div className="page-title">ONYILOKWU AI</div>
      <div className="page-subtitle">
        Your personal AI financial guide powered by DeepSeek + RAG knowledge base.
        Ask anything about stocks, markets, or investing in plain English.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="pixel-btn" onClick={() => send(s)} disabled={typing} style={{ fontSize: 7 }}>
            {s}
          </button>
        ))}
      </div>

      <div className="pixel-card" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          background: 'var(--pink)',
          margin: '-20px -20px 16px -20px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '2px solid var(--pink-dark)',
        }}>
          <div className="oni-avatar" style={{ width: 32, height: 32, fontSize: 16 }}>★</div>
          <div>
            <div style={{ fontSize: 11, color: '#fff', fontFamily: 'Press Start 2P' }}>ONYILOKWU AI</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', fontFamily: 'Press Start 2P', marginTop: 4 }}>
              "one who knows the way" — Idoma language · DeepSeek + RAG
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(255,255,255,0.7)', fontFamily: 'Press Start 2P' }}>
            {typing ? '● THINKING...' : '● ONLINE'}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 16,
          minHeight: 360,
          maxHeight: 520,
          paddingRight: 4,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%' }}>
              {m.role === 'ai' ? (
                <div className="oni-bubble">
                  <div className="oni-header">
                    <div className="oni-avatar">★</div>
                    ONYILOKWU
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: 9, lineHeight: 2.2, color: 'var(--text)' }}>
                    {m.text}
                    {m.streaming && <span style={{ opacity: 0.5, animation: 'blink 1s infinite' }}>▌</span>}
                  </div>
                </div>
              ) : (
                <div className="user-bubble">
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>YOU</div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: 9 }}>{m.text}</div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, borderTop: '2px solid var(--border-light)', paddingTop: 16 }}>
          <input
            className="pixel-input"
            placeholder="Ask about any stock, term, or market concept..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={typing}
          />
          <button className="pixel-btn active-btn" onClick={() => send()} disabled={typing} style={{ minWidth: 80 }}>
            {typing ? '...' : 'ASK ▶'}
          </button>
        </div>

        <div style={{ fontSize: 7, color: 'var(--text-3)', marginTop: 10 }}>
          Powered by DeepSeek AI + custom RAG knowledge base. Requires DEEPSEEK_API_KEY in backend/.env
        </div>

        {/* Quick jump */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <span style={{ fontSize: 7, color: 'var(--text-3)', alignSelf: 'center' }}>JUMP TO:</span>
          {['AAPL','NVDA','TSLA','MSFT','JPM','JNJ','XOM','META'].map(s => (
            <button key={s} className="pixel-btn" style={{ fontSize: 6, padding: '4px 8px' }} onClick={() => navigate(`/company?sym=${s}`)}>{s}</button>
          ))}
          <button className="pixel-btn" style={{ fontSize: 6, padding: '4px 8px' }} onClick={() => navigate('/screener')}>SCREENER</button>
          <button className="pixel-btn" style={{ fontSize: 6, padding: '4px 8px' }} onClick={() => navigate('/portfolio')}>PORTFOLIO</button>
        </div>
      </div>
    </div>
  );
}
