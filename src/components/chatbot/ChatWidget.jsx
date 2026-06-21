import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatbot } from "./useChatbot";
import "./ChatWidget.css";

// Icons (inline SVG for zero extra dependencies)
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M12 2v4M8 11V7a4 4 0 018 0v4" />
    <circle cx="9" cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
  </svg>
);

const TypingDots = () => (
  <div className="havi-chat-typing">
    <span /><span /><span />
  </div>
);

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`havi-chat-msg ${isUser ? "havi-chat-msg--user" : "havi-chat-msg--ai"}`}
    >
      {!isUser && (
        <div className="havi-chat-avatar">
          <BotIcon />
        </div>
      )}
      <div className={`havi-chat-bubble ${isUser ? "havi-chat-bubble--user" : "havi-chat-bubble--ai"} ${msg.error ? "havi-chat-bubble--error" : ""}`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function ChatWidget() {
  const {
    isOpen, messages, input, setInput, isLoading,
    hasNewMessage, quickActions, sendMessage, sendQuickAction, toggleChat,
  } = useChatbot();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  return (
    <>

      <div className="havi-chat-widget">
        {/* Chat Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="havi-chat-panel"
            >
              {/* Header */}
              <div className="havi-chat-header">
                <div className="havi-chat-header-avatar"><BotIcon /></div>
                <div className="havi-chat-header-info">
                  <div className="havi-chat-header-name">HAVI Assistant</div>
                  <div className="havi-chat-header-status">Online • Typically replies instantly</div>
                </div>
                <button className="havi-chat-close" onClick={toggleChat}><CloseIcon /></button>
              </div>

              {/* Messages */}
              <div className="havi-chat-messages">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isLoading && (
                  <div className="havi-chat-msg havi-chat-msg--ai">
                    <div className="havi-chat-avatar"><BotIcon /></div>
                    <div className="havi-chat-bubble havi-chat-bubble--ai">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {showQuickActions && (
                <div className="havi-chat-quick">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      className="havi-chat-quick-btn"
                      onClick={() => sendQuickAction(action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="havi-chat-input-area">
                <textarea
                  ref={inputRef}
                  className="havi-chat-input"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="havi-chat-send"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                >
                  <SendIcon />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          className="havi-chat-fab"
          onClick={toggleChat}
          whileTap={{ scale: 0.93 }}
        >
          {!isOpen && <div className="havi-chat-fab-pulse" />}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CloseIcon />
              </motion.span>
            ) : (
              <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <BotIcon />
              </motion.span>
            )}
          </AnimatePresence>
          {hasNewMessage && !isOpen && (
            <motion.div
              className="havi-chat-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              1
            </motion.div>
          )}
        </motion.button>
      </div>
    </>
  );
}
