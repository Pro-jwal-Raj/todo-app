import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useChatStore from "../../stores/chatStore";
import useAuthStore from "../../stores/authStore";
import { supabase } from "../../lib/supabase";
import {
  FiSend,
  FiMessageCircle,
  FiTrash2,
  FiChevronDown,
  FiSmile,
  FiMinimize2,
} from "react-icons/fi";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "💯"];

// Notification sound
const playNotification = (() => {
  let ctx;
  return () => {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.08;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };
})();

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function renderContent(text) {
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (/(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
          {part.length > 35 ? part.slice(0, 32) + "..." : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function FloatingChat({ groupId, groupName }) {
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const sending = useChatStore((s) => s.sending);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const subscribeToGroup = useChatStore((s) => s.subscribeToGroup);
  const unsubscribe = useChatStore((s) => s.unsubscribe);

  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevMsgCount = useRef(0);
  const typingTimeout = useRef(null);
  const channelRef = useRef(null);

  // Subscribe when opened
  useEffect(() => {
    if (groupId && isOpen) {
      fetchMessages(groupId);
      subscribeToGroup(groupId);
      setupPresence();
    }
    return () => {
      if (!groupId) unsubscribe();
      cleanupPresence();
    };
  }, [groupId, isOpen]);

  const setupPresence = useCallback(() => {
    if (!groupId || channelRef.current) return;
    const channel = supabase.channel(`typing-float-${groupId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setTypingUsers((prev) => {
            if (prev.find((u) => u.id === payload.userId)) return prev;
            return [...prev, { id: payload.userId, name: payload.name }];
          });
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.id !== payload.userId));
          }, 3000);
        }
      })
      .subscribe();
    channelRef.current = channel;
  }, [groupId, user]);

  const cleanupPresence = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const broadcastTyping = () => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: user.id,
        name: user.user_metadata?.display_name || "Someone",
      },
    });
  };

  // Notification + unread
  useEffect(() => {
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender?.id !== user?.id) {
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        } else {
          playNotification();
        }
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, isOpen, user]);

  // Auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    setShowScrollBtn(
      container.scrollHeight - container.scrollTop - container.clientHeight > 150
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const msg = input;
    setInput("");
    setShowEmoji(false);
    await sendMessage(groupId, msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typingTimeout.current) {
      broadcastTyping();
      typingTimeout.current = setTimeout(() => {
        typingTimeout.current = null;
      }, 2000);
    }
  };

  // Floating button (collapsed)
  if (!isOpen) {
    return (
      <motion.button
        className="floating-chat-btn"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        title={`Chat with ${groupName}`}
      >
        <FiMessageCircle size={22} />
        {unreadCount > 0 && (
          <span className="floating-chat-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className="floating-chat-panel"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Header */}
      <div className="floating-chat-header">
        <div className="floating-chat-title">
          <FiMessageCircle />
          <span>{groupName}</span>
          <span className="chat-msg-count">{messages.length}</span>
        </div>
        <div className="floating-chat-actions">
          <button onClick={() => setIsOpen(false)} title="Minimize">
            <FiMinimize2 />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="floating-chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && (
          <div className="chat-loading">
            <div className="chat-loading-dots"><span /><span /><span /></div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Chat with your team here</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender?.id === user?.id;
          const showSender = !isOwn && (i === 0 || messages[i - 1]?.sender?.id !== msg.sender?.id);
          const showDate =
            i === 0 ||
            new Date(msg.created_at).toDateString() !==
              new Date(messages[i - 1].created_at).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="chat-date-separator">
                  <span>
                    {new Date(msg.created_at).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className={`chat-message ${isOwn ? "own" : "other"} ${msg.message_type === "system" ? "system" : ""}`}>
                {msg.message_type === "system" ? (
                  <div className="chat-system-msg">{msg.content}</div>
                ) : (
                  <>
                    {showSender && (
                      <div className="chat-sender-info">
                        <div className="chat-avatar">
                          {msg.sender?.display_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="chat-sender-name">
                          {msg.sender?.display_name || "Unknown"}
                        </span>
                      </div>
                    )}
                    <div className="chat-bubble">
                      <p>{renderContent(msg.content)}</p>
                      <span className="chat-time">{formatTime(msg.created_at)}</span>
                      {isOwn && (
                        <button
                          className="chat-delete-btn"
                          onClick={() => deleteMessage(msg.id)}
                          title="Delete"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="chat-typing">
            <div className="typing-dots"><span /><span /><span /></div>
            <span>
              {typingUsers.map((u) => u.name).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            className="chat-scroll-btn floating"
            onClick={scrollToBottom}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <FiChevronDown />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            className="chat-emoji-picker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInput((p) => p + emoji);
                  inputRef.current?.focus();
                  setShowEmoji(false);
                }}
                className="emoji-btn"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <button
          type="button"
          className="chat-emoji-toggle"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          <FiSmile />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          disabled={sending}
        />
        <motion.button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || sending}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiSend />
        </motion.button>
      </form>
    </motion.div>
  );
}
