import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, ImageInput, Label } from "../../components/admin/ui";
import { slugify } from "../../lib/slug";

const BlogsEditor = () => (
  <CollectionEditor
    resource="blogs"
    title="Blogs Editor"
    subtitle="Write, update, and manage article posts on the public blog page."
    blank={{
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      imageUrl: "",
      category: "Trends",
      author: "HAVI'S DESIGN",
      readTime: "5 min read",
      published: true,
    }}
    renderRow={(b) => (
      <div className="flex items-center gap-3">
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
          {b.imageUrl && (
            <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{b.title}</p>
          <p className="truncate text-sm text-stone">
            {b.category} · {b.readTime} {b.published ? "· Published" : "· Draft"}
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
          label="URL Slug (auto-generated — edit if needed)"
          value={d.slug}
          onChange={(v) => set({ slug: slugify(v), _slugTouched: true })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <select
              value={d.category}
              onChange={(e) => set({ category: e.target.value })}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent text-sm"
            >
              <option value="Trends">Trends</option>
              <option value="Guides">Guides</option>
              <option value="Case Study">Case Study</option>
            </select>
          </div>
          <TextField label="Read Time" value={d.readTime} onChange={(v) => set({ readTime: v })} />
        </div>
        <TextField label="Author" value={d.author} onChange={(v) => set({ author: v })} />
        <TextArea label="Excerpt / Short Summary" value={d.excerpt} onChange={(v) => set({ excerpt: v })} />
        <TextArea label="Article Content (HTML/Paragraphs)" value={d.content} onChange={(v) => set({ content: v })} />
        <ImageInput label="Cover Image" value={d.imageUrl} onChange={(v) => set({ imageUrl: v })} />
        
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="published-chk"
            checked={!!d.published}
            onChange={(e) => set({ published: e.target.checked })}
            className="h-4 w-4 accent-ink rounded cursor-pointer"
          />
          <label htmlFor="published-chk" className="text-sm font-medium text-ink select-none cursor-pointer">
            Publish this article immediately
          </label>
        </div>
      </>
    )}
  />
);

export default BlogsEditor;
