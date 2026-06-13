import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DEFAULT_SITE } from "../../lib/defaults";

/**
 * Loads a single settings group (e.g. "hero") for editing, falling back to the
 * built-in defaults if the API/DB is unavailable. Returns form state + a save fn.
 */
export default function useSettingsGroup(key) {
  const [form, setForm] = useState(DEFAULT_SITE.settings[key]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    api
      .getSettings()
      .then((all) => {
        if (all[key]) setForm({ ...DEFAULT_SITE.settings[key], ...all[key] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [key]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setStatus("saving");
    try {
      await api.saveSettings(key, form);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return { form, setForm, update, save, loading, status };
}
