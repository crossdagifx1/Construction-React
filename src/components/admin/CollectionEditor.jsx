import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiLoader } from "react-icons/fi";
import { api } from "../../lib/api";
import { PageTitle, Card } from "./ui";

/**
 * Generic list + add/edit/delete editor for a CRUD resource.
 *
 * @param {string} resource      API resource name (e.g. "services")
 * @param {string} title         Page title
 * @param {string} subtitle      Page subtitle
 * @param {object} blank         A blank item template for "add new"
 * @param {(item) => ReactNode} renderRow   Compact row preview
 * @param {(item, set) => ReactNode} renderForm  Edit form fields; `set(patch)` updates draft
 */
const CollectionEditor = ({ resource, title, subtitle, blank, renderRow, renderForm }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null); // current item being edited/created
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .list(resource)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [resource]);

  const startNew = () => setDraft({ ...blank, _new: true });
  const startEdit = (item) => setDraft({ ...item });
  const cancel = () => setDraft(null);
  const setDraftPatch = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const saveDraft = async () => {
    setSaving(true);
    setError("");
    try {
      const { _new, id, createdAt, ...data } = draft;
      if (_new) await api.create(resource, data);
      else await api.update(resource, id, data);
      setDraft(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this item? This can't be undone.")) return;
    await api.remove(resource, id).catch((e) => setError(e.message));
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <PageTitle title={title} subtitle={subtitle} />
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-deep"
        >
          <FiPlus /> Add
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-stone">
          <FiLoader className="animate-spin" /> Loading…
        </p>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <Card className="text-center text-stone">No items yet — add your first.</Card>
          )}
          {items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">{renderRow(item)}</div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(item)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-stone hover:bg-sand hover:text-ink"
                  aria-label="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-stone hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / create modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-tightest">
                {draft._new ? "Add new" : "Edit"}
              </h2>
              <button onClick={cancel} className="text-stone hover:text-ink" aria-label="Close">
                <FiX size={22} />
              </button>
            </div>

            <div className="space-y-4">{renderForm(draft, setDraftPatch)}</div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancel}
                className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-stone"
              >
                Cancel
              </button>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:bg-accent-deep disabled:opacity-60"
              >
                {saving && <FiLoader className="animate-spin" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionEditor;
