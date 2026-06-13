import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";
import PageHero from "../components/PageHero";
import { api } from "../lib/api";
import { DEFAULT_SITE } from "../lib/defaults";
import { fadeUp, EASE } from "../sections/animation";

const CATEGORIES = ["All", "Trends", "Guides", "Case Study"];

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    api
      .getBlogs()
      .then((data) => setBlogs(data?.length ? data : DEFAULT_SITE.blogs))
      .catch(() => setBlogs(DEFAULT_SITE.blogs))
      .finally(() => setLoading(false));
  }, []);

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredBlog = filteredBlogs.find((b) => b.published) || blogs[0];
  const otherBlogs = filteredBlogs.filter((b) => b.id !== (featuredBlog?.id || ""));

  return (
    <>
      <PageHero
        eyebrow="Company News & Insights"
        title="Thinking, design"
        accent="& design stories."
        subtitle="Explore our design concepts, material analyses, workspace case studies, and insights from the team."
      />

      <section className="bg-paper pb-28">
        <div className="shell">
          {/* Featured Post */}
          {featuredBlog && !search && activeCategory === "All" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="group mb-16 overflow-hidden rounded-2xl border border-line bg-sand/35"
            >
              <Link to={`/blog/${featuredBlog.slug}`} className="grid grid-cols-1 lg:grid-cols-12">
                <div className="overflow-hidden lg:col-span-7">
                  <img
                    src={featuredBlog.imageUrl}
                    alt={featuredBlog.title}
                    className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-96 lg:h-[480px]"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-5">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-accent font-medium">
                    <span>{featuredBlog.category}</span>
                    <span className="h-1 w-1 rounded-full bg-stone/40" />
                    <span className="flex items-center gap-1"><FiClock /> {featuredBlog.readTime}</span>
                  </div>
                  <h2 className="display mt-4 text-3xl leading-snug sm:text-4xl transition-colors group-hover:text-accent duration-300">
                    {featuredBlog.title}
                  </h2>
                  <p className="mt-4 text-stone leading-relaxed">
                    {featuredBlog.excerpt}
                  </p>
                  <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-accent-deep transition-colors">
                    Read Article <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Search and Filters */}
          <div className="mb-12 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-center md:justify-between">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-ink text-paper"
                      : "bg-sand/40 text-stone hover:bg-sand/75 hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/60" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-line bg-sand/20 py-2.5 pl-11 pr-5 text-sm text-ink outline-none placeholder:text-stone/55 focus:border-accent focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Blogs Grid */}
          {loading ? (
            <div className="py-20 text-center text-stone">Loading articles...</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-20 text-center text-stone">
              No articles found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {(search || activeCategory !== "All" ? filteredBlogs : otherBlogs).map((b, idx) => (
                <motion.article
                  key={b.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: (idx % 3) * 0.1, duration: 0.6 }}
                  className="group flex flex-col"
                >
                  <Link to={`/blog/${b.slug}`} className="flex-1 flex flex-col">
                    <div className="overflow-hidden rounded-xl border border-line bg-sand/30 aspect-[16/10]">
                      <img
                        src={b.imageUrl}
                        alt={b.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent font-medium">
                        <span>{b.category}</span>
                        <span>•</span>
                        <span>{b.readTime}</span>
                      </div>
                      <h3 className="font-display mt-3 text-xl leading-snug text-ink transition-colors group-hover:text-accent duration-300">
                        {b.title}
                      </h3>
                      <p className="mt-2 text-sm text-stone leading-relaxed line-clamp-3">
                        {b.excerpt}
                      </p>
                      <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-stone font-semibold">
                        <FiCalendar /> {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default BlogPage;
