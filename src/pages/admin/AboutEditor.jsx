import { FiPlus, FiTrash2 } from "react-icons/fi";
import useSettingsGroup from "../../components/admin/useSettingsGroup";
import {
  PageTitle,
  Card,
  TextField,
  TextArea,
  ImageInput,
  SaveBar,
  Label,
} from "../../components/admin/ui";

const AboutEditor = () => {
  const { form, update, save, status } = useSettingsGroup("about");
  const stats = form.stats || [];

  const setStat = (i, patch) =>
    update({ stats: stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const addStat = () =>
    update({ stats: [...stats, { value: 0, suffix: "+", label: "New stat" }] });
  const removeStat = (i) => update({ stats: stats.filter((_, idx) => idx !== i) });

  return (
    <div className="max-w-3xl">
      <PageTitle title="About" subtitle="Studio story, imagery and headline stats." />

      <Card className="space-y-5">
        <TextField label="Eyebrow" value={form.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextField
          label="Heading (wrap an accent word in {curly braces})"
          value={form.heading}
          onChange={(v) => update({ heading: v })}
        />
        <TextArea label="Paragraph 1" value={form.body1} onChange={(v) => update({ body1: v })} />
        <TextArea label="Paragraph 2" value={form.body2} onChange={(v) => update({ body2: v })} />
        <TextField label="Badge text (e.g. Since 2014)" value={form.since} onChange={(v) => update({ since: v })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageInput label="Image 1 (large)" value={form.image1} onChange={(v) => update({ image1: v })} />
          <ImageInput label="Image 2 (inset)" value={form.image2} onChange={(v) => update({ image2: v })} />
        </div>
      </Card>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <Label>Headline stats</Label>
          <button
            onClick={addStat}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-accent"
          >
            <FiPlus /> Add stat
          </button>
        </div>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-3">
              <div className="col-span-3">
                <Label>Value</Label>
                <input
                  type="number"
                  value={s.value}
                  onChange={(e) => setStat(i, { value: Number(e.target.value) })}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="col-span-3">
                <Label>Suffix</Label>
                <input
                  value={s.suffix}
                  onChange={(e) => setStat(i, { suffix: e.target.value })}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="col-span-5">
                <Label>Label</Label>
                <input
                  value={s.label}
                  onChange={(e) => setStat(i, { label: e.target.value })}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={() => removeStat(i)}
                className="col-span-1 grid h-10 place-items-center rounded-lg text-stone hover:text-red-600"
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

export default AboutEditor;
