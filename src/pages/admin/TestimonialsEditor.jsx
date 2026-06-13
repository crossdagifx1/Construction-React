import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, ImageInput } from "../../components/admin/ui";

const TestimonialsEditor = () => (
  <CollectionEditor
    resource="testimonials"
    title="Testimonials"
    subtitle="Client quotes shown across the site."
    blank={{ name: "", post: "", quote: "", imageUrl: "" }}
    renderRow={(t) => (
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sand">
          {t.imageUrl && (
            <img src={t.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{t.name}</p>
          <p className="truncate text-sm text-stone">{t.post}</p>
        </div>
      </div>
    )}
    renderForm={(d, set) => (
      <>
        <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
        <TextField label="Role / title" value={d.post} onChange={(v) => set({ post: v })} />
        <TextArea label="Quote" value={d.quote} onChange={(v) => set({ quote: v })} />
        <ImageInput label="Photo" value={d.imageUrl} onChange={(v) => set({ imageUrl: v })} />
      </>
    )}
  />
);

export default TestimonialsEditor;
