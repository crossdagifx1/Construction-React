import { useEffect, useState } from "react";
import { FiMail, FiTrash2, FiCheckCircle, FiLoader, FiPhone } from "react-icons/fi";
import { api } from "../../lib/api";
import { PageTitle, Card } from "../../components/admin/ui";

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api
      .listMessages()
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (m) => {
    await api.markMessage(m.id, !m.read).catch(() => {});
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this message?")) return;
    await api.deleteMessage(id).catch(() => {});
    load();
  };

  return (
    <div className="max-w-3xl">
      <PageTitle title="Messages" subtitle="Enquiries submitted through the contact form." />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-stone">
          <FiLoader className="animate-spin" /> Loading…
        </p>
      ) : messages.length === 0 ? (
        <Card className="text-center text-stone">No messages yet.</Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={m.read ? "opacity-70" : "border-accent/40"}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-medium">{m.name}</p>
                    {!m.read && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-deep">
                        New
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                      <FiMail size={13} /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                        <FiPhone size={13} /> {m.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => toggleRead(m)}
                    className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-sand ${
                      m.read ? "text-stone" : "text-accent-deep"
                    }`}
                    title={m.read ? "Mark unread" : "Mark read"}
                  >
                    <FiCheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-stone hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {m.message}
              </p>
              <p className="mt-3 text-xs text-stone">{fmt(m.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
