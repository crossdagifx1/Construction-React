import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiMapPin, FiPhone, FiMail, FiPlus, FiX, FiCheck, FiInfo } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import PageHero from "../components/PageHero";
import { api } from "../lib/api";
import { DEFAULT_SITE } from "../lib/defaults";
import { fadeUp } from "../sections/animation";

const CATEGORIES = [
  "All",
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

const AdListingPage = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "Material Supply",
    description: "",
    price: "",
    location: "Addis Ababa",
    contactPhone: "",
    contactEmail: "",
    imageUrl: "",
    featuresString: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadAds = () => {
    setLoading(true);
    api
      .getAds()
      .then((data) => setAds(data?.length ? data : DEFAULT_SITE.ads))
      .catch(() => setAds(DEFAULT_SITE.ads))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAds();
  }, []);

  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(search.toLowerCase()) ||
      ad.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || ad.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title || !formData.description || !formData.contactPhone) {
      setFormError("Please fill in all required fields (Title, Description, Phone).");
      return;
    }

    setSubmitting(true);
    try {
      // Split comma separated features
      const features = formData.featuresString
        ? formData.featuresString.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        imageUrl: formData.imageUrl || undefined,
        features,
      };

      await api.submitAd(payload);
      
      // Reset form & close modal
      setFormData({
        title: "",
        type: "Material Supply",
        description: "",
        price: "",
        location: "Addis Ababa",
        contactPhone: "",
        contactEmail: "",
        imageUrl: "",
        featuresString: "",
      });
      setShowModal(false);
      
      // Show success
      setSuccessMsg("Your ad listing was posted successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);

      // Reload
      loadAds();
    } catch (err) {
      setFormError(err.message || "Failed to submit ad. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to construct WhatsApp link
  const getWhatsAppLink = (phone, title) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const text = encodeURIComponent(`Hello, I saw your listing "${title}" on HAVI'S DESIGN and would like to learn more.`);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <>
      <PageHero
        eyebrow="Marketplace listings"
        title="Classified ad boards"
        accent="& source fittings."
        subtitle="Browse building materials, tools for hire, expert contracting services, custom woodwork, and home automation listings."
      />

      <section className="bg-paper pb-28">
        <div className="shell">
          {/* Header Action Row */}
          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-stone font-medium">
                Showing {filteredAds.length} out of {ads.length} active postings
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper hover:bg-accent-deep transition-all duration-300"
            >
              <FiPlus /> Post an Ad Listing
            </button>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-green-800"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-green-600 text-white">
                  <FiCheck />
                </div>
                <div>
                  <p className="font-semibold">Success</p>
                  <p className="text-sm">{successMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Column / Header */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left sidebar filters for desktop, top selector for mobile */}
            <div className="lg:col-span-3">
              <div className="sticky top-28 space-y-6">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/50" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-line bg-sand/15 py-3 pl-11 pr-5 text-sm text-ink outline-none placeholder:text-stone/50 focus:border-accent focus:bg-white transition-all"
                  />
                </div>

                {/* Categories */}
                <div className="hidden lg:block">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone mb-4">Ad Categories</h3>
                  <div className="flex flex-col gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-left rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          activeCategory === cat
                            ? "bg-ink text-paper"
                            : "text-stone hover:bg-sand/60 hover:text-ink"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile categories (horizontal scroll) */}
                <div className="block lg:hidden overflow-x-auto scrollbar-none py-1">
                  <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                          activeCategory === cat
                            ? "bg-ink text-paper"
                            : "bg-sand/40 text-stone"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right listings board grid */}
            <div className="lg:col-span-9">
              {loading ? (
                <div className="py-20 text-center text-stone">Loading postings...</div>
              ) : filteredAds.length === 0 ? (
                <div className="rounded-2xl border border-line border-dashed py-24 text-center">
                  <FiInfo className="mx-auto text-stone/40 mb-3" size={32} />
                  <p className="text-lg font-medium text-ink">No Listings Available</p>
                  <p className="text-sm text-stone mt-2">Try resetting your category or search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {filteredAds.map((ad, idx) => (
                    <motion.div
                      key={ad.id}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ delay: (idx % 2) * 0.08, duration: 0.6 }}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white hover:shadow-lg transition-shadow duration-300"
                    >
                      <div>
                        {/* Image */}
                        <div className="relative overflow-hidden aspect-[16/10] bg-sand">
                          <img
                            src={ad.imageUrl || "/assets/project1.jpg"}
                            alt={ad.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                          />
                          {ad.featured && (
                            <span className="absolute left-3 top-3 rounded bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-paper">
                              Featured
                            </span>
                          )}
                          {ad.price && (
                            <span className="absolute right-3 bottom-3 rounded-lg bg-paper/90 px-3 py-1.5 text-xs font-bold text-accent-deep shadow-md backdrop-blur-sm">
                              {ad.price}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-6">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                            {ad.type}
                          </span>
                          <h3 className="font-display text-xl text-ink mt-2 tracking-tightest leading-snug">
                            {ad.title}
                          </h3>
                          <p className="text-sm text-stone mt-3 leading-relaxed">
                            {ad.description}
                          </p>

                          {/* Features */}
                          {ad.features && Array.isArray(ad.features) && ad.features.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {ad.features.map((f, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-sand/65 px-2.5 py-0.5 text-[10px] font-medium text-stone"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Actions Footer */}
                      <div className="border-t border-line bg-sand/20 px-6 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-stone font-medium">
                            <FiMapPin className="text-accent" />
                            <span>{ad.location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* WhatsApp link */}
                            <a
                              href={getWhatsAppLink(ad.contactPhone, ad.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="grid h-9 w-9 place-items-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <FaWhatsapp size={16} />
                            </a>

                            {/* Call link */}
                            <a
                              href={`tel:${ad.contactPhone}`}
                              className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-paper hover:bg-accent transition-colors"
                              title="Call Advertiser"
                            >
                              <FiPhone size={14} />
                            </a>

                            {/* Email link */}
                            {ad.contactEmail && (
                              <a
                                href={`mailto:${ad.contactEmail}?subject=Inquiry for ${ad.title}`}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-stone hover:border-ink hover:text-ink transition-all"
                                title="Send Email"
                              >
                                <FiMail size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Post Ad Listing Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 py-8 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl tracking-tightest text-ink">Post your ad listing</h2>
                <p className="text-xs text-stone mt-1">Submit listing specs. They will be displayed on the public board.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-sand/40 text-stone hover:text-ink"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            {formError && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{formError}</p>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                  Ad Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="E.g., High-Grade Birch Joinery Plywood"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Ad Category *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Price (Label)
                  </label>
                  <input
                    type="text"
                    name="price"
                    placeholder="E.g. ETB 12,000 or Negotiable"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                  Ad Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Detail the specifications, conditions, and availability of your item or service offering..."
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    required
                    placeholder="E.g. +251995270894"
                    value={formData.contactPhone}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="E.g. seller@mail.com"
                    value={formData.contactEmail}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                    Image Link (URL)
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    placeholder="URL to image or leave blank for default"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
                  Key Specs/Highlights (comma separated)
                </label>
                <input
                  type="text"
                  name="featuresString"
                  placeholder="E.g. Warranty included, Certified installation, Free delivery"
                  value={formData.featuresString}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-line bg-paper/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-stone hover:border-ink hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:bg-accent-deep disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Submit Listing"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdListingPage;
