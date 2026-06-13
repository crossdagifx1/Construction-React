import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectPage from "./pages/ProjectPage";
import ContactPage from "./pages/ContactPage";
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
import Messages from "./pages/admin/Messages";

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
          <Route path="messages" element={<Messages />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
