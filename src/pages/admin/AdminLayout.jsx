import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiGrid,
  FiList,
  FiImage,
  FiMessageSquare,
  FiLogOut,
  FiExternalLink,
  FiMenu,
  FiX,
  FiPhone,
  FiBookOpen,
  FiTag,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/HAVI LOGO.png";

const links = [
  { to: "/admin", label: "Dashboard", icon: FiHome, end: true },
  { to: "/admin/hero", label: "Hero / Landing", icon: FiImage },
  { to: "/admin/about", label: "About", icon: FiUser },
  { to: "/admin/services", label: "Services", icon: FiGrid },
  { to: "/admin/process", label: "Process", icon: FiList },
  { to: "/admin/projects", label: "Projects", icon: FiImage },
  { to: "/admin/testimonials", label: "Testimonials", icon: FiMessageSquare },
  { to: "/admin/blogs", label: "Blogs Editor", icon: FiBookOpen },
  { to: "/admin/ads", label: "Ad Postings", icon: FiTag },
  { to: "/admin/contact", label: "Contact info", icon: FiPhone },
  { to: "/admin/messages", label: "Messages", icon: FiMessageSquare },
];

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const NavList = () => (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-ink text-paper"
                  : "text-stone hover:bg-sand hover:text-ink"
              }`
            }
          >
            <Icon size={17} />
            {l.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3 lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 rounded-full" />
          <span className="font-display tracking-tightest">Admin</span>
        </Link>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-line bg-white p-5 transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Link to="/admin" className="mb-8 hidden items-center gap-3 lg:flex">
            <img src={logo} alt="HAVI'S DESIGN" className="h-10 w-10 rounded-full" />
            <span>
              <span className="block font-display text-lg tracking-tightest">
                HAVI'S DESIGN
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-stone">
                Content admin
              </span>
            </span>
          </Link>

          <NavList />

          <div className="mt-8 flex flex-col gap-1 border-t border-line pt-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-stone transition-colors hover:bg-sand hover:text-ink"
            >
              <FiExternalLink size={17} /> View site
            </a>
            <button
              onClick={doLogout}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-stone transition-colors hover:bg-sand hover:text-ink"
            >
              <FiLogOut size={17} /> Sign out
            </button>
          </div>

          {admin && (
            <p className="mt-6 truncate text-xs text-stone">
              Signed in as {admin.email}
            </p>
          )}
        </aside>

        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          />
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
