import { FiPlus, FiTrash2 } from "react-icons/fi";
import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, ImageInput, Label } from "../../components/admin/ui";
import { slugify } from "../../lib/slug";

const GalleryInput = ({ value = [], onChange }) => {
  const items = Array.isArray(value) ? value : [];
  const setItem = (i, url) => onChange(items.map((x, idx) => (idx === i ? url : x)));
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>Gallery images</Label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-accent"
        >
          <FiPlus /> Add image
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-stone">No gallery images yet.</p>
        )}
        {items.map((url, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <ImageInput label="" value={url} onChange={(v) => setItem(i, v)} />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-stone hover:text-red-600"
              aria-label="Remove"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectsEditor = () => (
  <CollectionEditor
    resource="projects"
    title="Projects"
    subtitle="Each project gets its own page with a before/after slider and gallery."
    blank={{
      title: "",
      tag: "Residential",
      imageUrl: "",
      wide: false,
      slug: "",
      description: "",
      year: "",
      location: "",
      area: "",
      beforeUrl: "",
      afterUrl: "",
      gallery: [],
    }}
    renderRow={(p) => (
      <div className="flex items-center gap-3">
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
          {p.imageUrl && (
            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{p.title}</p>
          <p className="truncate text-sm text-stone">
            {p.tag}
            {p.wide ? " · wide" : ""}
            {p.beforeUrl && p.afterUrl ? " · before/after" : ""}
          </p>
        </div>
      </div>
    )}
    renderForm={(d, set) => (
      <>
        <TextField
          label="Title"
          value={d.title}
          onChange={(v) => set({ title: v, slug: d._slugTouched ? d.slug : slugify(v) })}
        />
        <TextField
          label="URL slug (auto from title — edit if needed)"
          value={d.slug}
          onChange={(v) => set({ slug: slugify(v), _slugTouched: true })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Tag (e.g. Residential)" value={d.tag} onChange={(v) => set({ tag: v })} />
          <TextField label="Year" value={d.year} onChange={(v) => set({ year: v })} />
          <TextField label="Location" value={d.location} onChange={(v) => set({ location: v })} />
          <TextField label="Area (e.g. 240 m²)" value={d.area} onChange={(v) => set({ area: v })} />
        </div>
        <TextArea
          label="Description (shown on the project page)"
          value={d.description}
          onChange={(v) => set({ description: v })}
        />
        <ImageInput label="Cover image (card + page hero)" value={d.imageUrl} onChange={(v) => set({ imageUrl: v })} />

        <div className="rounded-xl border border-line bg-sand/50 p-4">
          <Label>Before / After</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageInput label="Before" value={d.beforeUrl} onChange={(v) => set({ beforeUrl: v })} />
            <ImageInput label="After" value={d.afterUrl} onChange={(v) => set({ afterUrl: v })} />
          </div>
          <p className="mt-2 text-xs text-stone">
            Add both to show a draggable comparison slider on the project page.
          </p>
        </div>

        <GalleryInput value={d.gallery} onChange={(v) => set({ gallery: v })} />

        <div>
          <Label>Layout</Label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!d.wide}
              onChange={(e) => set({ wide: e.target.checked })}
              className="h-4 w-4 accent-ink"
            />
            Wide (spans two columns in the grid)
          </label>
        </div>
      </>
    )}
  />
);

export default ProjectsEditor;
