import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DEFAULT_SITE } from "../../lib/defaults";
import {
  PageTitle,
  Card,
  TextField,
  TextArea,
  SaveBar,
  Label,
} from "../../components/admin/ui";

const ContactEditor = () => {
  const [contact, setContact] = useState(DEFAULT_SITE.settings.contact);
  const [marquee, setMarquee] = useState(DEFAULT_SITE.settings.marquee);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    api
      .getSettings()
      .then((all) => {
        if (all.contact) setContact({ ...DEFAULT_SITE.settings.contact, ...all.contact });
        if (all.marquee) setMarquee({ ...DEFAULT_SITE.settings.marquee, ...all.marquee });
      })
      .catch(() => {});
  }, []);

  const upd = (patch) => setContact((c) => ({ ...c, ...patch }));
  const items = marquee.items || [];
  const setItem = (i, v) => setMarquee({ items: items.map((x, idx) => (idx === i ? v : x)) });
  const addItem = () => setMarquee({ items: [...items, "New item"] });
  const removeItem = (i) => setMarquee({ items: items.filter((_, idx) => idx !== i) });

  const save = async () => {
    setStatus("saving");
    try {
      await Promise.all([
        api.saveSettings("contact", contact),
        api.saveSettings("marquee", marquee),
      ]);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Contact info"
        subtitle="Addresses, phone, email and the scrolling marquee."
      />

      <Card className="space-y-5">
        <TextField label="Eyebrow" value={contact.eyebrow} onChange={(v) => upd({ eyebrow: v })} />
        <TextField
          label="Heading (wrap accent word in {braces})"
          value={contact.heading}
          onChange={(v) => upd({ heading: v })}
        />
        <TextArea label="Blurb" value={contact.blurb} onChange={(v) => upd({ blurb: v })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Phone (display)" value={contact.phone} onChange={(v) => upd({ phone: v })} />
          <TextField label="Phone link (tel:...)" value={contact.phoneHref} onChange={(v) => upd({ phoneHref: v })} />
        </div>
        <TextField label="Email" value={contact.email} onChange={(v) => upd({ email: v })} />
        <TextField label="Address" value={contact.address} onChange={(v) => upd({ address: v })} />
        <div className="border-t border-line/60 pt-4 mt-4 space-y-4">
          <Label>Social Media Channels</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField label="TikTok URL" value={contact.tiktok || ""} onChange={(v) => upd({ tiktok: v })} />
            <TextField label="Instagram URL" value={contact.instagram || ""} onChange={(v) => upd({ instagram: v })} />
            <TextField label="YouTube URL" value={contact.youtube || ""} onChange={(v) => upd({ youtube: v })} />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <Label>Marquee items</Label>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-accent"
          >
            <FiPlus /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) => setItem(i, e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent"
              />
              <button
                onClick={() => removeItem(i)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-stone hover:text-red-600"
                aria-label="Remove"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <SaveBar onSave={save} status={status} />
    </div>
  );
};

export default ContactEditor;
