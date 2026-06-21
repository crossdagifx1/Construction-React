import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: "📊", end: true },
      { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
    ],
  },
  {
    label: "Bookings & Comms",
    items: [
      { to: "/admin/bookings", label: "Bookings", icon: "📅" },
      { to: "/admin/messages", label: "Messages", icon: "✉️" },
      { to: "/admin/chat-logs", label: "Chat Logs", icon: "💬" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/hero", label: "Hero Section", icon: "🖼️" },
      { to: "/admin/about", label: "About", icon: "ℹ️" },
      { to: "/admin/services", label: "Services", icon: "⚙️" },
      { to: "/admin/process", label: "Process Steps", icon: "🔄" },
      { to: "/admin/projects", label: "Projects", icon: "🏗️" },
      { to: "/admin/testimonials", label: "Testimonials", icon: "⭐" },
      { to: "/admin/blogs", label: "Blog Posts", icon: "📝" },
      { to: "/admin/ads", label: "Listings", icon: "📌" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/admin/contact", label: "Contact Info", icon: "📞" },
    ],
  },
];

function useNotificationCount(token) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, refresh: fetchCount };
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("havi_admin_token");
  const { count: notifCount, refresh: refreshNotifs } = useNotificationCount(token);

  const handleLogout = () => {
    localStorage.removeItem("havi_admin_token");
    navigate("/admin/login");
  };

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0c0b0a" : "#f4f1ec",
    sidebar: isDark ? "#111010" : "#ffffff",
    sidebarBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    topbar: isDark ? "rgba(17,16,16,0.95)" : "rgba(255,255,255,0.95)",
    text: isDark ? "#f5f0ea" : "#1a1612",
    textMuted: isDark ? "rgba(245,240,234,0.4)" : "rgba(26,22,18,0.4)",
    cardBg: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    accent: "#c8a96e",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: 240, flexShrink: 0, background: colors.sidebar,
              borderRight: `1px solid ${colors.sidebarBorder}`,
              height: "100vh", position: "sticky", top: 0,
              overflow: "hidden auto", display: "flex", flexDirection: "column",
              scrollbarWidth: "none",
            }}
          >
            {/* Logo */}
            <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${colors.sidebarBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 16, flexShrink: 0,
                }}>H</div>
                <div>
                  <div style={{ color: colors.text, fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>HAVI'S</div>
                  <div style={{ color: colors.accent, fontWeight: 600, fontSize: 11, letterSpacing: 1.5 }}>ADMIN</div>
                </div>
              </div>
            </div>

            {/* Nav Groups */}
            <nav style={{ flex: 1, padding: "12px 10px" }}>
              {NAV_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                    color: colors.textMuted, padding: "4px 10px", marginBottom: 4,
                    textTransform: "uppercase",
                  }}>{group.label}</div>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      style={({ isActive }) => ({
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 10, marginBottom: 2,
                        textDecoration: "none", fontSize: 13.5, fontWeight: 500,
                        color: isActive ? colors.accent : colors.textMuted,
                        background: isActive ? `rgba(200,169,110,0.1)` : "transparent",
                        transition: "all 0.15s",
                      })}
                    >
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      {item.label}
                      {item.label === "Notifications" && notifCount > 0 && (
                        <span style={{
                          marginLeft: "auto", background: "#ef4444",
                          color: "#fff", borderRadius: 10, padding: "1px 6px",
                          fontSize: 10, fontWeight: 700,
                        }}>{notifCount}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            {/* User section */}
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${colors.sidebarBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                }}>A</div>
                <div>
                  <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>Admin</div>
                  <div style={{ color: colors.textMuted, fontSize: 11 }}>HAVI'S DESIGN</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "8px 0", borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
                  color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 60, background: colors.topbar,
          borderBottom: `1px solid ${colors.sidebarBorder}`,
          display: "flex", alignItems: "center", padding: "0 20px",
          gap: 12, position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(12px)",
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4, display: "flex", flexDirection: "column", gap: 4 }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: "block", width: 18, height: 2, background: "currentColor", borderRadius: 2 }} />
            ))}
          </button>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 340 }}>
            {searchOpen ? (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "100%", opacity: 1 }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => { setSearchOpen(false); setSearchQuery(""); }}
                  placeholder="Search bookings, messages, blogs..."
                  style={{
                    width: "100%", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                    border: `1px solid ${colors.sidebarBorder}`, borderRadius: 10,
                    padding: "7px 14px", color: colors.text, fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  border: `1px solid ${colors.sidebarBorder}`, borderRadius: 10,
                  padding: "7px 14px", color: colors.textMuted,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                🔍 Search...
                <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>⌘K</span>
              </button>
            )}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              style={{
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                border: `1px solid ${colors.sidebarBorder}`,
                borderRadius: 10, padding: "7px 12px", cursor: "pointer",
                color: colors.text, fontSize: 16,
              }}
              title="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Notifications */}
            <NavLink
              to="/admin/notifications"
              onClick={refreshNotifs}
              style={{
                position: "relative", textDecoration: "none",
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                border: `1px solid ${colors.sidebarBorder}`,
                borderRadius: 10, padding: "7px 12px",
                color: colors.text, fontSize: 16, display: "flex", alignItems: "center",
              }}
            >
              🔔
              {notifCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: "absolute", top: -4, right: -4,
                    background: "#ef4444", color: "#fff",
                    borderRadius: "50%", width: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                  }}
                >{notifCount > 99 ? "99+" : notifCount}</motion.span>
              )}
            </NavLink>

            {/* View site */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(160,120,64,0.1))",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: 10, padding: "7px 14px", fontSize: 13,
                color: "#c8a96e", fontWeight: 600, textDecoration: "none",
              }}
            >
              View Site ↗
            </a>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 28px", overflow: "auto" }}>
          <Outlet context={{ colors, theme, refreshNotifs }} />
        </main>
      </div>
    </div>
  );
}
