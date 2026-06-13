import useSettingsGroup from "../../components/admin/useSettingsGroup";
import {
  PageTitle,
  Card,
  TextField,
  TextArea,
  ImageInput,
  SaveBar,
} from "../../components/admin/ui";

const HeroEditor = () => {
  const { form, update, save, status } = useSettingsGroup("hero");

  return (
    <div className="max-w-3xl">
      <PageTitle title="Hero / Landing" subtitle="The first thing visitors see." />

      <Card className="space-y-5">
        <TextField
          label="Eyebrow"
          value={form.eyebrow}
          onChange={(v) => update({ eyebrow: v })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Headline line 1"
            value={form.titleLine1}
            onChange={(v) => update({ titleLine1: v })}
          />
          <TextField
            label="Headline line 2"
            value={form.titleLine2}
            onChange={(v) => update({ titleLine2: v })}
          />
        </div>
        <TextField
          label="Accent line (shown in gold italic)"
          value={form.titleAccent}
          onChange={(v) => update({ titleAccent: v })}
        />
        <TextArea
          label="Subtitle"
          value={form.subtitle}
          onChange={(v) => update({ subtitle: v })}
        />
        <ImageInput
          label="Hero image (cutout / portrait)"
          value={form.image}
          onChange={(v) => update({ image: v })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Stat value (e.g. 120+)"
            value={form.statValue}
            onChange={(v) => update({ statValue: v })}
          />
          <TextField
            label="Stat label"
            value={form.statLabel}
            onChange={(v) => update({ statLabel: v })}
          />
        </div>
      </Card>

      <SaveBar onSave={save} status={status} />
    </div>
  );
};

export default HeroEditor;
