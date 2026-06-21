import { useState, useCallback, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SESSION_KEY = "havi_chat_session_id";

const QUICK_ACTIONS = [
  { label: "📅 Book a consultation", message: "I'd like to book a free consultation." },
  { label: "🏠 Our services", message: "What services do you offer?" },
  { label: "💰 Pricing info", message: "Can you tell me about your pricing?" },
  { label: "📍 Location & contact", message: "Where are you located and how can I contact you?" },
];

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm HAVI, your design assistant. How can I help you today?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  });
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Show bubble notification after 5s if chat hasn't been opened
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setHasNewMessage(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text) => {
      const userText = (text || input).trim();
      if (!userText || isLoading) return;

      const userMsg = {
        id: Date.now().toString(),
        role: "user",
        content: userText,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText, sessionId }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to send message");

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again or contact us directly!",
            createdAt: new Date(),
            error: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, sessionId]
  );

  const sendQuickAction = useCallback(
    (action) => {
      sendMessage(action.message);
    },
    [sendMessage]
  );

  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasNewMessage(false);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setHasNewMessage(false);
  }, []);

  return {
    isOpen,
    messages,
    input,
    setInput,
    isLoading,
    hasNewMessage,
    quickActions: QUICK_ACTIONS,
    sendMessage,
    sendQuickAction,
    openChat,
    closeChat,
    toggleChat,
  };
}
