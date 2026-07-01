import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import ChatWidget from "./components/chatbot/ChatWidget";


import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectPage from "./pages/ProjectPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import AdListingPage from "./pages/AdListingPage";
import BookingPage from "./pages/BookingPage";
import NotFound from "./pages/NotFound";

import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import HeroEditor from "./pages/admin/HeroEditor";
import AboutEditor from "./pages/admin/AboutEditor";
import ContactEditor from "./pages/admin/ContactEditor";
import ServicesEditor from "./pages/admin/ServicesEditor";
import ProcessEditor from "./pages/admin/ProcessEditor";
import ProjectsEditor from "./pages/admin/ProjectsEditor";
import TestimonialsEditor from "./pages/admin/TestimonialsEditor";
import BlogsEditor from "./pages/admin/BlogsEditor";
import AdsEditor from "./pages/admin/AdsEditor";
import Messages from "./pages/admin/Messages";
import BookingsManager from "./pages/admin/BookingsManager";
import ChatLogs from "./pages/admin/ChatLogs";
import NotificationsPage from "./pages/admin/NotificationsPage";

import ProtectedRoute, { TechAdminRoute } from "./components/ProtectedRoute";
import TechDashboard from "./pages/admin/tech/TechDashboard";
import AIManager from "./pages/admin/tech/AIManager";
import ErrorMonitor from "./pages/admin/tech/ErrorMonitor";
import ReportCenter from "./pages/admin/tech/ReportCenter";
import SystemHealth from "./pages/admin/tech/SystemHealth";


function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:slug" element={<ProjectPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/listings" element={<AdListingPage />} />
          <Route path="/booking" element={<BookingPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="hero" element={<HeroEditor />} />
          <Route path="about" element={<AboutEditor />} />
          <Route path="contact" element={<ContactEditor />} />
          <Route path="services" element={<ServicesEditor />} />
          <Route path="process" element={<ProcessEditor />} />
          <Route path="projects" element={<ProjectsEditor />} />
          <Route path="testimonials" element={<TestimonialsEditor />} />
          <Route path="blogs" element={<BlogsEditor />} />
          <Route path="ads" element={<AdsEditor />} />
          <Route path="messages" element={<Messages />} />
          {/* New routes */}
          <Route path="bookings" element={<BookingsManager />} />
          <Route path="chat-logs" element={<ChatLogs />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* ── Technical Admin routes ── */}
          <Route path="tech" element={<TechAdminRoute><TechDashboard /></TechAdminRoute>} />
          <Route path="tech/ai" element={<TechAdminRoute><AIManager /></TechAdminRoute>} />
          <Route path="tech/errors" element={<TechAdminRoute><ErrorMonitor /></TechAdminRoute>} />
          <Route path="tech/reports" element={<TechAdminRoute><ReportCenter /></TechAdminRoute>} />
          <Route path="tech/system" element={<TechAdminRoute><SystemHealth /></TechAdminRoute>} />
        </Route>


        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global AI chatbot — shown on all public pages */}
      <ChatWidget />
    </>
  );
}

export default App;
