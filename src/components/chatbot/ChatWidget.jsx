import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useChatbot } from "./useChatbot";
import "./ChatWidget.css";

function parseMessageContent(content) {
  let text = content || "";
  const suggestions = [];
  const buttons = [];
  const images = [];

  // Parse [Suggest: Label]
  const suggestRegex = /\[Suggest:\s*([^\]]+)\]/g;
  let match;
  while ((match = suggestRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  text = text.replace(suggestRegex, "");

  // Parse [Book Consultation]
  const bookRegex = /\[Book Consultation\]/g;
  let hasBookButton = false;
  if (bookRegex.test(text)) {
    hasBookButton = true;
    text = text.replace(bookRegex, "");
  }

  // Parse [Button: Label|Path]
  const buttonRegex = /\[Button:\s*([^|\]]+)\|([^\]]+)\]/g;
  while ((match = buttonRegex.exec(text)) !== null) {
    buttons.push({ label: match[1].trim(), path: match[2].trim() });
  }
  text = text.replace(buttonRegex, "");

  // Parse [Image: Url|Caption] or [Image: Url]
  const imageRegex = /\[Image:\s*([^|\]]+)(?:\|([^\]]+))?\]/g;
  while ((match = imageRegex.exec(text)) !== null) {
    images.push({ url: match[1].trim(), caption: match[2] ? match[2].trim() : "" });
  }
  text = text.replace(imageRegex, "");

  // Clean up any remaining raw "/booking" or "visiting /booking" phrases
  if (text.toLowerCase().includes("/booking")) {
    hasBookButton = true;
    text = text.replace(/visiting \/booking/gi, "using the scheduler below");
    text = text.replace(/\/booking/gi, "the scheduler below");
  }

  // Auto-detect booking intent from keywords in the text (as safety check)
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes("booking scheduler") ||
    lowerText.includes("booking page") ||
    lowerText.includes("book a consultation") ||
    lowerText.includes("schedule a consultation") ||
    lowerText.includes("book a free consultation")
  ) {
    hasBookButton = true;
  }

  // If the message has a booking button but no suggest chips, auto-provide Yes/No options
  if (hasBookButton && suggestions.length === 0) {
    suggestions.push("Yes, let's book");
    suggestions.push("Maybe later");
  } else if (
    (lowerText.includes("pricing") || lowerText.includes("cost") || lowerText.includes("price") || lowerText.includes("etb")) &&
    suggestions.length === 0
  ) {
    suggestions.push("Book consultation");
    suggestions.push("What services do you offer?");
  }

  return {
    cleanText: text.trim(),
    suggestions,
    buttons,
    images,
    hasBookButton,
  };
}

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

function MessageBubble({ msg, onCloseChat }) {
  const isUser = msg.role === "user";
  const navigate = useNavigate();

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="havi-chat-msg havi-chat-msg--user"
      >
        <div className="havi-chat-bubble havi-chat-bubble--user">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  const { cleanText, buttons, images, hasBookButton } = parseMessageContent(msg.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="havi-chat-msg havi-chat-msg--ai"
    >
      <div className="havi-chat-avatar">
        <BotIcon />
      </div>
      <div className={`havi-chat-bubble havi-chat-bubble--ai ${msg.error ? "havi-chat-bubble--error" : ""}`}>
        {cleanText && <div className="havi-chat-text" style={{ whiteSpace: "pre-line" }}>{cleanText}</div>}

        {images.map((img, idx) => (
          <div key={idx} className="havi-chat-img-container" style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
            <img src={img.url} alt={img.caption || "Design visual"} style={{ width: "100%", height: "auto", display: "block" }} />
            {img.caption && (
              <div style={{ padding: "6px 8px", fontSize: 11, background: "rgba(0,0,0,0.05)", color: "#6F6A62", fontFamily: "sans-serif" }}>
                {img.caption}
              </div>
            )}
          </div>
        ))}

        {(hasBookButton || buttons.length > 0) && (
          <div className="havi-chat-buttons-container" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {hasBookButton && (
              <button
                onClick={() => {
                  navigate("/booking");
                  onCloseChat();
                }}
                className="havi-chat-action-btn"
                style={{
                  background: "#B98A4B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(185, 138, 75, 0.2)",
                  transition: "all 0.2s"
                }}
              >
                Book Free Consultation
              </button>
            )}
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  navigate(btn.path);
                  onCloseChat();
                }}
                className="havi-chat-action-btn"
                style={{
                  background: "#121110",
                  color: "#F6F3ED",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                  transition: "all 0.2s"
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatWidget() {
  const {
    isOpen, messages, input, setInput, isLoading,
    hasNewMessage, quickActions, sendMessage, sendQuickAction, toggleChat,
    closeChat,
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

  const lastMsg = messages[messages.length - 1];
  const isLastMsgAi = lastMsg && lastMsg.role === "assistant";
  const parsedLastMsg = isLastMsgAi ? parseMessageContent(lastMsg.content) : null;
  const activeSuggestions = parsedLastMsg ? parsedLastMsg.suggestions : [];

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
                  <MessageBubble key={msg.id} msg={msg} onCloseChat={closeChat} />
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

              {/* Dynamic Suggestions / Quick Actions */}
              {!isLoading && (
                <div className="havi-chat-quick" style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 16px", background: "transparent" }}>
                  {activeSuggestions.length > 0 ? (
                    activeSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="havi-chat-quick-btn"
                        onClick={() => sendMessage(suggestion)}
                        style={{
                          background: "#EFE9DF",
                          border: "1px solid #E2DCD0",
                          borderRadius: 16,
                          padding: "6px 12px",
                          fontSize: 12,
                          color: "#121110",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {suggestion}
                      </button>
                    ))
                  ) : showQuickActions ? (
                    quickActions.map((action) => (
                      <button
                        key={action.label}
                        className="havi-chat-quick-btn"
                        onClick={() => sendQuickAction(action)}
                      >
                        {action.label}
                      </button>
                    ))
                  ) : null}
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
