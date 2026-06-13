import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiGrid,
  FiList,
  FiImage,
  FiMessageSquare,
  FiArrowUpRight,
  FiAlertCircle,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { PageTitle, Card } from "../../components/admin/ui";

const Dashboard = () => {
  const [counts, setCounts] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.list("services"),
      api.list("process"),
      api.list("projects"),
      api.list("testimonials"),
      api.listMessages(),
    ])
      .then(([services, process, projects, testimonials, messages]) => {
        setCounts({
          services: services.length,
          process: process.length,
          projects: projects.length,
          testimonials: testimonials.length,
          messages: messages.length,
        });
        setUnread(messages.filter((m) => !m.read).length);
      })
      .catch(() => setError(true));
  }, []);

  const tiles = [
    { label: "Projects", value: counts?.projects, icon: FiImage, to: "/admin/projects" },
    { label: "Services", value: counts?.services, icon: FiGrid, to: "/admin/services" },
    { label: "Process steps", value: counts?.process, icon: FiList, to: "/admin/process" },
    { label: "Testimonials", value: counts?.testimonials, icon: FiMessageSquare, to: "/admin/testimonials" },
  ];

  return (
    <div>
      <PageTitle
        title="Welcome back"
        subtitle="Manage every part of your public site from here."
      />

      {error && (
        <Card className="mb-6 flex items-start gap-3 border-amber-300 bg-amber-50">
          <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Couldn't reach the API/database. The site still shows default content,
            but saving and live data need the server running and Supabase
            connected. See <span className="font-medium">SETUP.md</span>.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} to={t.to}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Icon className="text-accent-deep" size={20} />
                  <FiArrowUpRight className="text-stone" />
                </div>
                <p className="mt-4 font-display text-4xl tracking-tightest">
                  {t.value ?? "—"}
                </p>
                <p className="mt-1 text-sm text-stone">{t.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/admin/messages" className="lg:col-span-2">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <div>
              <p className="font-display text-2xl tracking-tightest">Messages</p>
              <p className="mt-1 text-sm text-stone">
                {unread > 0 ? `${unread} unread enquiry${unread > 1 ? "ies" : "y"}` : "No unread enquiries"}
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper">
              <FiMessageSquare size={20} />
            </span>
          </Card>
        </Link>
        <Link to="/admin/hero">
          <Card className="flex h-full items-center justify-between transition-shadow hover:shadow-md">
            <div>
              <p className="font-display text-2xl tracking-tightest">Landing</p>
              <p className="mt-1 text-sm text-stone">Edit hero & images</p>
            </div>
            <FiImage className="text-accent-deep" size={20} />
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
