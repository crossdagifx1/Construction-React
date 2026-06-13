import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, IconSelect } from "../../components/admin/ui";
import { getIcon } from "../../lib/icons";

const ServicesEditor = () => (
  <CollectionEditor
    resource="services"
    title="Services"
    subtitle="The studio offering shown on the landing page."
    blank={{ icon: "FiPenTool", title: "", about: "" }}
    renderRow={(s) => {
      const Icon = getIcon(s.icon);
      return (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{s.title}</p>
            <p className="truncate text-sm text-stone">{s.about}</p>
          </div>
        </div>
      );
    }}
    renderForm={(d, set) => (
      <>
        <IconSelect value={d.icon} onChange={(v) => set({ icon: v })} />
        <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
        <TextArea label="Description" value={d.about} onChange={(v) => set({ about: v })} />
      </>
    )}
  />
);

export default ServicesEditor;
