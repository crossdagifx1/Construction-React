import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, IconSelect } from "../../components/admin/ui";
import { getIcon } from "../../lib/icons";

const ProcessEditor = () => (
  <CollectionEditor
    resource="process"
    title="Process"
    subtitle="The step-by-step approach shown on the home and about pages."
    blank={{ icon: "FiSearch", step: "01", title: "", about: "" }}
    renderRow={(s) => {
      const Icon = getIcon(s.icon);
      return (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-paper">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              <span className="text-accent-deep">{s.step}</span> · {s.title}
            </p>
            <p className="truncate text-sm text-stone">{s.about}</p>
          </div>
        </div>
      );
    }}
    renderForm={(d, set) => (
      <>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Step (e.g. 01)" value={d.step} onChange={(v) => set({ step: v })} />
          <div className="col-span-2">
            <IconSelect value={d.icon} onChange={(v) => set({ icon: v })} />
          </div>
        </div>
        <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
        <TextArea label="Description" value={d.about} onChange={(v) => set({ about: v })} />
      </>
    )}
  />
);

export default ProcessEditor;
