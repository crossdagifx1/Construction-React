/* eslint-disable react/prop-types */
import CollectionEditor from "../../components/admin/CollectionEditor";
import { TextField, TextArea, ImageInput, Label } from "../../components/admin/ui";

const AD_TYPES = [
  "Material Supply",
  "Machinery Rental",
  "Interior Styling",
  "Construction Contracting",
  "Architectural Services",
  "Smart Home Installation",
  "Landscaping & Gardens",
  "Plumbing & Piping",
  "Electrical Installations",
  "Custom Woodwork",
  "Metal Fabrication",
];

const FeaturesInput = ({ value = [], onChange }) => {
  const text = Array.isArray(value) ? value.join(", ") : "";
  const update = (v) => {
    onChange(v.split(",").map((x) => x.trim()).filter(Boolean));
  };

  return (
    <TextField
      label="Highlights/Features (comma separated list)"
      value={text}
      onChange={update}
      placeholder="E.g. Heat resistant, Delivery included, 1-year warranty"
    />
  );
};

const AdsEditor = () => (
  <CollectionEditor
    resource="ads"
    title="Ad Postings"
    subtitle="Moderate, edit, feature, and delete listings posted on the marketplace classifieds board."
    blank={{
      title: "",
      type: "Material Supply",
      description: "",
      price: "",
      location: "Addis Ababa",
      contactPhone: "",
      contactEmail: "",
      imageUrl: "",
      features: [],
      approved: true,
      featured: false,
    }}
    renderRow={(ad) => (
      <div className="flex items-center gap-3">
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{ad.title}</p>
          <p className="truncate text-sm text-stone">
            {ad.type} · {ad.price || "No Price"} · {ad.approved ? "Approved" : "Pending Approval"}
          </p>
        </div>
      </div>
    )}
    renderForm={(d, set) => (
      <>
        <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Ad Category</Label>
            <select
              value={d.type}
              onChange={(e) => set({ type: e.target.value })}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-accent text-sm"
            >
              {AD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <TextField label="Price / Cost Label" value={d.price} onChange={(v) => set({ price: v })} />
        </div>

        <TextArea label="Description" value={d.description} onChange={(v) => set({ description: v })} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Location" value={d.location} onChange={(v) => set({ location: v })} />
          <TextField label="Contact Phone" value={d.contactPhone} onChange={(v) => set({ contactPhone: v })} />
        </div>
        <TextField label="Contact Email" value={d.contactEmail} onChange={(v) => set({ contactEmail: v })} />

        <ImageInput label="Product/Service Image" value={d.imageUrl} onChange={(v) => set({ imageUrl: v })} />

        <FeaturesInput value={d.features} onChange={(v) => set({ features: v })} />

        <div className="flex flex-col gap-2 pt-2">
          <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={!!d.approved}
              onChange={(e) => set({ approved: e.target.checked })}
              className="h-4 w-4 accent-ink rounded cursor-pointer"
            />
            Approved (Visible on public board)
          </label>
          <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={!!d.featured}
              onChange={(e) => set({ featured: e.target.checked })}
              className="h-4 w-4 accent-ink rounded cursor-pointer"
            />
            Featured listing (Promoted badge)
          </label>
        </div>
      </>
    )}
  />
);

export default AdsEditor;
