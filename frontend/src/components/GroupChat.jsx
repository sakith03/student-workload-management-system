// FILE: frontend/src/components/GroupChat.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { groupChatApi } from '../api/groupChatApi';
import { useAuth } from '../context/AuthContext';
import '../styles/groupchat.css';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0);
  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDate(messages, index) {
  if (index === 0) return true;
  const curr = new Date(messages[index].sentAt).toDateString();
  const prev = new Date(messages[index - 1].sentAt).toDateString();
  return curr !== prev;
}

// Soft, readable gradients for classmate avatars
const AVATAR_COLORS = [
  'linear-gradient(135deg, #818cf8, #6366f1)',
  'linear-gradient(135deg, #34d399, #059669)',
  'linear-gradient(135deg, #fbbf24, #ea580c)',
  'linear-gradient(135deg, #f472b6, #db2777)',
  'linear-gradient(135deg, #22d3ee, #0284c7)',
  'linear-gradient(135deg, #a78bfa, #7c3aed)',
  'linear-gradient(135deg, #fb923c, #c2410c)',
  'linear-gradient(135deg, #4ade80, #16a34a)',
];

function getAvatarColor(userId) {
  const key = userId != null ? String(userId) : '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Merge server list with optimistic temp-* messages not yet persisted (poll would otherwise wipe them). */
function mergeWithPendingOptimistic(serverMsgs, previous) {
  const pending = previous.filter(m => String(m.id).startsWith('temp-'));
  const merged = [...(serverMsgs || [])];
  for (const p of pending) {
    const onServer = merged.some(
      s =>
        String(s.senderUserId) === String(p.senderUserId) &&
        s.messageText === p.messageText
    );
    if (!onServer) merged.push(p);
  }
  merged.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
  return merged;
}

export default function GroupChat({ groupId, variant = 'default' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Load messages
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!groupId) return;
    if (showLoading) setLoading(true);
    try {
      const { data } = await groupChatApi.getMessages(groupId);
      const serverMsgs = data.messages || [];
      if (showLoading) {
        setMessages(serverMsgs);
      } else {
        setMessages(prev => mergeWithPendingOptimistic(serverMsgs, prev));
      }
      setError(null);
    } catch {
      if (showLoading) setError('Failed to load chat messages.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [groupId]);

  // Initial load
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    fetchMessages(true);
  }, [fetchMessages, groupId]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!groupId) return;
    pollRef.current = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages, groupId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSend = useCallback(async () => {
    if (!groupId || !input.trim() || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    // Optimistic update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      senderUserId: user?.id,
      senderName: 'You',
      messageText: text,
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await groupChatApi.sendMessage(groupId, text);
      // Replace temp message with real one
      setMessages(prev =>
        prev.map(m => m.id === tempMsg.id ? data : m)
      );
    } catch {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [input, sending, groupId, user]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe = (msg) => String(msg.senderUserId ?? '') === String(user?.id ?? '');

  if (!groupId) return null;

  return (
    <div className={`gc-container${variant === 'dock' ? ' gc-container--dock' : ''}`}>
      {/* Header */}
      <div className="gc-header">
        <div className="gc-header-icon" aria-hidden>💬</div>
        <div>
          <p className="gc-header-title">Team chat</p>
          <p className="gc-header-sub">
            {messages.length > 0
              ? `${messages.length} message${messages.length === 1 ? '' : 's'} in this workspace`
              : 'Say hi — quick questions & updates stay here'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="gc-messages">
        {loading ? (
          <div className="gc-loading">
            <div className="gc-spinner" />
            <p className="gc-loading-text">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="gc-empty">
            <div className="gc-empty-icon">💬</div>
            <p className="gc-empty-title">No messages yet</p>
            <p className="gc-empty-sub">
              Start the thread — share deadlines, links, or a quick hello to your teammates.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx}>
              {shouldShowDate(messages, idx) && (
                <div className="gc-date-sep">
                  <span className="gc-date-label">{formatDate(msg.sentAt)}</span>
                </div>
              )}
              <div className={`gc-msg ${isMe(msg) ? 'gc-msg--mine' : ''}`}>
                <div
                  className={`gc-avatar ${isMe(msg) ? 'gc-avatar--mine' : 'gc-avatar--other'}`}
                  style={!isMe(msg) ? { background: getAvatarColor(msg.senderUserId) } : {}}
                >
                  {getInitials(isMe(msg) ? 'You' : msg.senderName)}
                </div>
                <div className={`gc-bubble ${isMe(msg) ? 'gc-bubble--mine' : 'gc-bubble--other'}`}>
                  {!isMe(msg) && <p className="gc-sender">{msg.senderName}</p>}
                  <p className="gc-text">{msg.messageText}</p>
                  <span className="gc-time">{formatTime(msg.sentAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {error && <div className="gc-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="gc-input-wrap">
        <textarea
          ref={inputRef}
          className="gc-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message your group…"
          rows={1}
          disabled={sending || loading}
        />
        <button
          className="gc-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending || loading}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M14 2L2 6.5l5 2 2 5L14 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
