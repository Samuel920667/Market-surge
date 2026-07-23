import React, { useState, useRef, useEffect } from 'react';
import { askAIStream } from '../api/endpoints';

type Msg = { role: 'user' | 'ai'; text: string; streaming?: boolean };

const QUICK = ['Market today?', 'Tell me about NVIDIA', 'What is a dividend?', 'I am new to investing'];

export default function OnyilokwuFloat() {
  const [open, setOpen]     = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: `Hello! I'm Onyilokwu — your AI financial guide.\n\n"Onyilokwu" is an Idoma name meaning "one who knows the way."\n\nAsk me anything about stocks, markets, or investing!` },
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text?: string) {
    const q = (text || input).trim();
    if (!q || typing) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setTyping(true);
    setMessages(m => [...m, { role: 'ai', text: '', streaming: true }]);

    try {
      await askAIStream(
        q, '',
        (chunk) => {
          setMessages(m => {
            const updated = [...m];
            const last = updated[updated.length - 1];
            if (last.role === 'ai') updated[updated.length - 1] = { ...last, text: last.text + chunk };
            return updated;
          });
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        () => {
          setMessages(m => {
            const updated = [...m];
            const last = updated[updated.length - 1];
            if (last.role === 'ai') updated[updated.length - 1] = { ...last, streaming: false };
            return updated;
          });
          setTyping(false);
        },
      );
    } catch {
      setMessages(m => {
        const updated = [...m];
        const last = updated[updated.length - 1];
        if (last.role === 'ai') updated[updated.length - 1] = { ...last, text: 'Could not reach AI server. Make sure the backend is running.', streaming: false };
        return updated;
      });
      setTyping(false);
    }
  }

  return (
    <div className="oni-float">
      {open && (
        <div className="oni-float-panel">
          <div className="pixel-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
            {/* Header */}
            <div style={{ background: 'var(--pink)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--pink-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="oni-avatar">★</div>
                <div>
                  <div style={{ fontSize: 9, color: '#fff', fontFamily: 'Press Start 2P' }}>ONYILOKWU AI</div>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)', fontFamily: 'Press Start 2P', marginTop: 3 }}>
                    {typing ? '● THINKING...' : '● ONLINE — DeepSeek RAG'}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#fff', fontFamily: 'Press Start 2P' }}>✕</button>
            </div>

            {/* Quick chips */}
            <div style={{ padding: '10px 12px', background: 'var(--card-2)', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK.map(q => (
                <button key={q} className="pixel-btn" style={{ fontSize: 6, padding: '5px 8px' }} onClick={() => send(q)} disabled={typing}>{q}</button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  {m.role === 'ai' ? (
                    <div className="oni-bubble">
                      <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU</div>
                      <div style={{ whiteSpace: 'pre-line', fontSize: 8, lineHeight: 2 }}>
                        {m.text}
                        {m.streaming && <span style={{ opacity: 0.5 }}>▌</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="user-bubble">
                      <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)', marginBottom: 5 }}>YOU</div>
                      <div style={{ whiteSpace: 'pre-line', fontSize: 8 }}>{m.text}</div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '2px solid var(--border-light)', background: 'var(--card)', display: 'flex', gap: 8 }}>
              <input
                className="pixel-input"
                style={{ fontSize: 8 }}
                placeholder="Ask anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                disabled={typing}
              />
              <button className="pixel-btn active-btn" style={{ fontSize: 7, padding: '8px 12px' }} onClick={() => send()} disabled={typing}>
                {typing ? '...' : 'ASK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && <div className="oni-float-label">★ ONYILOKWU AI</div>}
      <button className="oni-float-btn" onClick={() => setOpen(o => !o)}>{open ? '✕' : '★'}</button>
    </div>
  );
}
