import { useState } from "react";
import { FiUploadCloud, FiCheck, FiLoader } from "react-icons/fi";
import { api } from "../../lib/api";
import { ICON_NAMES, getIcon } from "../../lib/icons";

export const Label = ({ children }) => (
  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-stone">
    {children}
  </label>
);

export const TextField = ({ label, value, onChange, ...rest }) => (
  <div>
    {label && <Label>{label}</Label>}
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-accent"
      {...rest}
    />
  </div>
);

export const TextArea = ({ label, value, onChange, rows = 4, ...rest }) => (
  <div>
    {label && <Label>{label}</Label>}
    <textarea
      rows={rows}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-accent"
      {...rest}
    />
  </div>
);

export const IconSelect = ({ label = "Icon", value, onChange }) => {
  const Preview = getIcon(value);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink">
          <Preview size={18} />
        </span>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none focus:border-accent"
        >
          {ICON_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Image field: shows a preview, accepts an upload OR a pasted URL.
export const ImageInput = ({ label = "Image", value, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex items-start gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-sand">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-stone">No image</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent">
            {busy ? (
              <FiLoader className="animate-spin" />
            ) : (
              <FiUploadCloud />
            )}
            {busy ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={busy} />
          </label>
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  );
};

// Sticky save button with status feedback.
export const SaveBar = ({ onSave, status, label = "Save changes" }) => (
  <div className="sticky bottom-0 mt-8 flex items-center gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur">
    <button
      onClick={onSave}
      disabled={status === "saving"}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-deep disabled:opacity-60"
    >
      {status === "saving" ? (
        <>
          <FiLoader className="animate-spin" /> Saving…
        </>
      ) : status === "saved" ? (
        <>
          <FiCheck /> Saved
        </>
      ) : (
        label
      )}
    </button>
    {status === "error" && (
      <span className="text-sm text-red-600">Couldn't save — check the API/DB connection.</span>
    )}
  </div>
);

export const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-line bg-white p-6 ${className}`}>
    {children}
  </div>
);

export const PageTitle = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="font-display text-3xl tracking-tightest text-ink">{title}</h1>
    {subtitle && <p className="mt-1 text-stone">{subtitle}</p>}
  </div>
);
