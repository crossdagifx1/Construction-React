import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiClock, FiCalendar, FiUser, FiShare2 } from "react-icons/fi";
import { api } from "../lib/api";
import { DEFAULT_SITE } from "../lib/defaults";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch individual blog
    api
      .getBlog(slug)
      .then((data) => {
        if (data && data.title) {
          setBlog(data);
        } else {
          // Fallback to static
          const found = DEFAULT_SITE.blogs.find((b) => b.slug === slug);
          setBlog(found || null);
        }
      })
      .catch(() => {
        const found = DEFAULT_SITE.blogs.find((b) => b.slug === slug);
        setBlog(found || null);
      });

    // Fetch all blogs for related articles
    api
      .getBlogs()
      .then((data) => setAllBlogs(data?.length ? data : DEFAULT_SITE.blogs))
      .catch(() => setAllBlogs(DEFAULT_SITE.blogs))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-stone">
        Loading article...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper py-20 text-center">
        <h1 className="display text-4xl">Article Not Found</h1>
        <p className="mt-4 text-stone">The post you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper">
          Back to Blog
        </Link>
      </div>
    );
  }

  // Get related blogs (excluding current, max 3)
  const related = allBlogs
    .filter((b) => b.id !== blog.id && b.published)
    .slice(0, 3);

  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-paper min-h-screen pt-32 pb-24">
      <div className="shell">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone hover:text-ink transition-colors mb-8"
        >
          <FiArrowLeft /> Back to blog
        </Link>

        {/* Article Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="eyebrow justify-center mb-6 text-accent">{blog.category}</span>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tightest">
            {blog.title}
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-stone border-y border-line py-4">
            <span className="flex items-center gap-1.5">
              <FiUser /> {blog.author || "HAVI'S DESIGN"}
            </span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span className="flex items-center gap-1.5">
              <FiCalendar /> {formattedDate}
            </span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span className="flex items-center gap-1.5">
              <FiClock /> {blog.readTime}
            </span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-5xl mx-auto mb-16 overflow-hidden rounded-2xl border border-line bg-sand/30 aspect-[21/9]">
          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Main Content Column */}
        <article className="max-w-2xl mx-auto">
          <div
            dangerouslySetInnerHTML={{ __html: blog.content }}
            className="text-stone text-lg leading-relaxed space-y-6 
              [&>p]:mb-5 [&>p]:leading-relaxed
              [&>h2]:text-3xl [&>h2]:font-display [&>h2]:text-ink [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:tracking-tightest
              [&>h3]:text-2xl [&>h3]:font-display [&>h3]:text-ink [&>h3]:mt-8 [&>h3]:mb-3
              [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:mb-6
              [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:mb-6
              [&>strong]:text-ink [&>strong]:font-semibold
              [&>blockquote]:border-l-4 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-ink/80 [&>blockquote]:my-6"
          />
        </article>

        {/* Social Share section */}
        <div className="max-w-2xl mx-auto border-t border-line mt-14 pt-8 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-stone font-semibold">Share this article</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Article link copied to clipboard!");
            }}
            className="flex items-center gap-2 text-sm font-medium text-ink hover:text-accent transition-colors"
          >
            <FiShare2 /> Copy link
          </button>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="max-w-5xl mx-auto border-t border-line mt-20 pt-16">
            <h2 className="display text-3xl mb-10 text-center sm:text-left">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((r) => (
                <div key={r.id} className="group flex flex-col">
                  <Link to={`/blog/${r.slug}`} className="flex-1 flex flex-col">
                    <div className="overflow-hidden rounded-xl border border-line bg-sand/30 aspect-[16/10] mb-4">
                      <img
                        src={r.imageUrl}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-accent font-semibold">
                      <span>{r.category}</span>
                    </div>
                    <h3 className="font-display mt-2 text-lg leading-snug text-ink transition-colors group-hover:text-accent duration-300">
                      {r.title}
                    </h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
