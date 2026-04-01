// FILE: frontend/src/components/FloatingChatbot.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatbotApi } from '../api/chatbotApi';

function TypingDots() {
  return (
    <div style={styles.typingWrap}>
      <span style={{ ...styles.dot, animationDelay: '0ms' }} />
      <span style={{ ...styles.dot, animationDelay: '160ms' }} />
      <span style={{ ...styles.dot, animationDelay: '320ms' }} />
    </div>
  );
}

function Bubble({ sender, text, time }) {
  const isUser = sender === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      {!isUser && <div style={styles.aiAvatar}>✦</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAi) }}>
        <p style={styles.bubbleText}>{text}</p>
        <span style={styles.bubbleTime}>
          {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
// workspaceGroupId  : passed from WorkspaceDetail when on a workspace page
// workspaceModuleName: the subject name e.g. "Operating Systems"
// layoutRightInset — distance from viewport right to the FAB/window (px). Use on workspace
// pages when a right dock (e.g. team chat) is open so the FAB sits left of that panel.
export default function FloatingChatbot({ workspaceGroupId, workspaceModuleName, layoutRightInset }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [moduleName, setModuleName] = useState('LoadMate Assistant');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const initRef = useRef(null);

  // Detect workspace from URL as fallback
  const workspaceMatch = location.pathname.match(/^\/workspace\/([^/]+)/);
  const groupId = workspaceGroupId || (workspaceMatch ? workspaceMatch[1] : null);
  const isWorkspace = Boolean(groupId);

  const [viewportW, setViewportW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rawRight = layoutRightInset ?? 28;
  const rightPx = Math.min(rawRight, Math.max(28, viewportW - 72));
  const windowWidthPx = Math.min(360, Math.max(260, viewportW - rightPx - 16));

  // Reset session when navigating to a different workspace
  useEffect(() => {
    if (groupId !== initRef.current) {
      setSessionId(null);
      setMessages([]);
      setError(null);
      initRef.current = null;
    }
  }, [groupId]);

  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  // Initialize chatbot when opened on a workspace page
  useEffect(() => {
    if (!open || !groupId) return;
    if (initRef.current === groupId) return;

    const init = async () => {
      setInitializing(true);
      setError(null);
      try {
        // Use the passed moduleName prop, or fallback to group ID
        const name = workspaceModuleName || 'General';
        setModuleName(name);

        const { data } = await chatbotApi.initialize(groupId, name);
        setSessionId(data.sessionId);
        initRef.current = groupId;

        const hist = await chatbotApi.getHistory(data.sessionId);
        setMessages(hist.data.messages || []);
      } catch {
        setError('Could not connect to AI. Please check your network.');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [open, groupId, workspaceModuleName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    if (!sessionId) {
      setMessages(prev => [
        ...prev,
        { sender: 'user', messageText: input.trim(), sentAt: new Date().toISOString() },
        { sender: 'ai', messageText: 'Please open a workspace to use the AI assistant. Navigate to Workspaces and open a group to get module-specific help!', sentAt: new Date().toISOString() },
      ]);
      setInput('');
      return;
    }

    const text = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { sender: 'user', messageText: text, sentAt: new Date().toISOString() }]);
    setLoading(true);

    try {
      const { data } = await chatbotApi.sendMessage(sessionId, text);
      setMessages(prev => [...prev, { sender: 'ai', messageText: data.aiResponse, sentAt: data.timestamp }]);
    } catch {
      setError('Failed to get a response. Please try again.');
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes chatbot-fadein { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes chatbot-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(99,179,237,0.5); } 50% { box-shadow:0 0 0 10px rgba(99,179,237,0); } }
        @keyframes dot-bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-5px); opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Floating button */}
      <button onClick={() => setOpen(p => !p)} title="AI Assistant" style={{
        ...styles.fab,
        right: rightPx,
        transition: 'right 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
        animation: pulse && !open ? 'chatbot-pulse 2s infinite' : 'none',
        background: open
          ? 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)'
          : 'linear-gradient(135deg, #2E86AB 0%, #1a5c7a 100%)',
      }}>
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2C6.03 2 2 5.806 2 10.5c0 1.9.63 3.66 1.7 5.08L2.5 19.5l4.2-1.14A9.3 9.3 0 0011 19c4.97 0 9-3.806 9-8.5S15.97 2 11 2z"
              fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="7.5" cy="10.5" r="1.2" fill="white" />
            <circle cx="11" cy="10.5" r="1.2" fill="white" />
            <circle cx="14.5" cy="10.5" r="1.2" fill="white" />
          </svg>
        )}
        {!open && isWorkspace && <span style={styles.fabBadge}>AI</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          ...styles.window,
          right: rightPx,
          width: windowWidthPx,
          transition: 'right 0.3s ease, width 0.3s ease',
        }}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>✦</div>
              <div>
                <p style={styles.headerTitle}>{isWorkspace ? moduleName : 'LoadMate Assistant'}</p>
                <p style={styles.headerSub}>
                  {initializing ? 'Connecting...' : isWorkspace ? 'Module AI · Online' : 'Open a workspace to start'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.headerClose}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {initializing ? (
              <div style={styles.centeredMsg}>
                <div style={styles.spinner} />
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>Initializing chatbot...</p>
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✦</div>
                <p style={styles.emptyTitle}>
                  {isWorkspace ? `Ask me anything about ${moduleName}` : 'AI Module Assistant'}
                </p>
                <p style={styles.emptySub}>
                  {isWorkspace
                    ? 'I can help with concepts, assignments, and study tips.'
                    : 'Navigate to a workspace to get module-specific AI help.'}
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <Bubble key={i} sender={m.sender} text={m.messageText} time={m.sentAt} />
              ))
            )}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={styles.aiAvatar}>✦</div>
                <TypingDots />
              </div>
            )}
            {error && <div style={styles.errorMsg}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputWrap}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isWorkspace ? `Ask about ${moduleName}...` : 'Open a workspace first...'}
              rows={1}
              style={styles.input}
              disabled={loading || initializing}
            />
            <button onClick={handleSend}
              disabled={!input.trim() || loading || initializing}
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || loading || initializing ? 0.4 : 1,
                cursor: !input.trim() || loading || initializing ? 'not-allowed' : 'pointer',
              }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 2L2 6.5l5 2 2 5L14 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p style={styles.footer}>Powered by Google Gemini · LoadMate AI</p>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: { position:'fixed', bottom:28, width:54, height:54, borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, boxShadow:'0 8px 32px rgba(46,134,171,0.4)' },
  fabBadge: { position:'absolute', top:-3, right:-3, background:'#f59e0b', color:'#fff', fontSize:9, fontWeight:700, borderRadius:6, padding:'1px 4px', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.05em' },
  window: { position:'fixed', bottom:92, width:360, height:520, maxHeight:'calc(100vh - 120px)', background:'#0f1e33', borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden', zIndex:9998, animation:'chatbot-fadein 0.25s ease', fontFamily:'DM Sans, sans-serif' },
  header: { background:'linear-gradient(135deg, #1a3a5c 0%, #0f2240 100%)', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  headerLeft: { display:'flex', alignItems:'center', gap:10 },
  headerIcon: { width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, #2E86AB, #1a5c7a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#7dd3fc', boxShadow:'0 2px 8px rgba(46,134,171,0.4)' },
  headerTitle: { margin:0, fontSize:13, fontWeight:600, color:'#f0f9ff', lineHeight:1.3, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  headerSub: { margin:0, fontSize:11, color:'#64a8c8', lineHeight:1.3 },
  headerClose: { background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  messages: { flex:1, overflowY:'auto', padding:'14px 14px 6px', scrollbarWidth:'thin', scrollbarColor:'#1e3a5f transparent' },
  bubble: { maxWidth:'78%', padding:'9px 13px', borderRadius:12, lineHeight:1.5 },
  bubbleUser: { background:'linear-gradient(135deg, #2E86AB, #1a6080)', borderBottomRightRadius:3, boxShadow:'0 2px 8px rgba(46,134,171,0.25)' },
  bubbleAi: { background:'#1a2f4e', borderBottomLeftRadius:3, border:'1px solid rgba(255,255,255,0.06)' },
  bubbleText: { margin:0, fontSize:13, color:'#e2eef7', whiteSpace:'pre-wrap', wordBreak:'break-word' },
  bubbleTime: { fontSize:10, color:'rgba(255,255,255,0.35)', display:'block', marginTop:4, textAlign:'right' },
  aiAvatar: { width:26, height:26, minWidth:26, borderRadius:8, background:'linear-gradient(135deg, #2E86AB, #1a5c7a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#7dd3fc', marginRight:8, alignSelf:'flex-end', marginBottom:2 },
  typingWrap: { display:'flex', alignItems:'center', gap:4, padding:'10px 13px', background:'#1a2f4e', borderRadius:'12px 12px 12px 3px', border:'1px solid rgba(255,255,255,0.06)' },
  dot: { display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#2E86AB', animation:'dot-bounce 1.2s infinite' },
  centeredMsg: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', paddingTop:60 },
  spinner: { width:28, height:28, border:'2px solid rgba(46,134,171,0.2)', borderTop:'2px solid #2E86AB', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  emptyState: { textAlign:'center', padding:'40px 20px 20px' },
  emptyIcon: { fontSize:28, color:'#2E86AB', marginBottom:12, filter:'drop-shadow(0 0 8px rgba(46,134,171,0.6))' },
  emptyTitle: { margin:'0 0 6px', fontSize:14, fontWeight:600, color:'#c8dff0' },
  emptySub: { margin:0, fontSize:12, color:'#4a7a9b', lineHeight:1.5 },
  errorMsg: { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#fca5a5', marginTop:6 },
  inputWrap: { display:'flex', alignItems:'flex-end', gap:8, padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'#0d1a2e' },
  input: { flex:1, background:'#1a2f4e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'9px 12px', fontSize:13, color:'#e2eef7', resize:'none', outline:'none', fontFamily:'DM Sans, sans-serif', lineHeight:1.5, maxHeight:100, overflowY:'auto', scrollbarWidth:'none' },
  sendBtn: { width:36, height:36, minWidth:36, borderRadius:10, background:'linear-gradient(135deg, #2E86AB, #1a6080)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.15s', boxShadow:'0 2px 8px rgba(46,134,171,0.3)' },
  footer: { textAlign:'center', fontSize:10, color:'#1e3a5f', padding:'4px 0 8px', margin:0, background:'#0d1a2e', letterSpacing:'0.03em' },
};