import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useChatStore from "../../stores/chatStore";
import useAuthStore from "../../stores/authStore";
import { supabase } from "../../lib/supabase";
import {
  FiSend,
  FiMessageCircle,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiSmile,
} from "react-icons/fi";

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

// Quick emoji picker
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "💯"];

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

// Detect URLs and render them as links
function renderContent(text) {
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
          {part.length > 40 ? part.slice(0, 37) + "..." : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function GroupChat({ groupId, groupName }) {
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const sending = useChatStore((s) => s.sending);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const subscribeToGroup = useChatStore((s) => s.subscribeToGroup);
  const unsubscribe = useChatStore((s) => s.unsubscribe);

  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  // Subscribe and fetch when group changes
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

  // Setup typing presence channel
  const setupPresence = useCallback(() => {
    if (!groupId || channelRef.current) return;

    const channel = supabase.channel(`typing-${groupId}`, {
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

  // Notification sound + unread count on new messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      const lastMsg = messages[messages.length - 1];
      const isFromOther = lastMsg?.sender?.id !== user?.id;

      if (isFromOther) {
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        } else {
          playNotification();
        }
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, isOpen, user]);

  // Auto-scroll to bottom on new messages (only if near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // Focus input when chat opens
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

  const insertEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
    setShowEmoji(false);
  };

  if (!groupId) return null;

  // Collapsed chat bubble
  if (!isOpen) {
    return (
      <motion.button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={`Chat in ${groupName}`}
      >
        <FiMessageCircle />
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className="group-chat"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
    >
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <FiMessageCircle />
          <span>{groupName} Chat</span>
          <span className="chat-msg-count">{messages.length}</span>
        </div>
        <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
          <FiX />
        </button>
      </div>

      {/* Messages area */}
      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && (
          <div className="chat-loading">
            <div className="chat-loading-dots">
              <span /><span /><span />
            </div>
            <p>Loading messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Start the conversation with your team!</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isOwn = msg.sender?.id === user?.id;
            const showAvatar =
              i === 0 || messages[i - 1]?.sender?.id !== msg.sender?.id;
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
                <motion.div
                  className={`chat-message ${isOwn ? "own" : "other"} ${msg.message_type === "system" ? "system" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  transition={{ duration: 0.15 }}
                >
                  {msg.message_type === "system" ? (
                    <div className="chat-system-msg">{msg.content}</div>
                  ) : (
                    <>
                      {!isOwn && showAvatar && (
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
                            title="Delete message"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
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

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            className="chat-scroll-btn"
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
              <button key={emoji} onClick={() => insertEmoji(emoji)} className="emoji-btn">
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
          placeholder="Type a message..."
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
