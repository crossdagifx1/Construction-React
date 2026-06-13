import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiArrowUpRight, FiArrowRight } from "react-icons/fi";
import { useSiteData } from "../context/SiteDataContext";
import { clipUp, EASE, fadeUp } from "../sections/animation";
import Reveal from "../components/Reveal";
import BeforeAfter from "../components/BeforeAfter";
import NotFound from "./NotFound";

const ProjectPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useSiteData();
  const projects = data.projects || [];

  const project =
    projects.find((p) => p.slug === slug) || projects.find((p) => p.id === slug);

  if (loading && !project) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-stone">
        Loading…
      </div>
    );
  }
  if (!project) return <NotFound />;

  const idx = projects.findIndex((p) => p.id === project.id);
  const next = projects[(idx + 1) % projects.length];

  const gallery = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
  const meta = [
    { label: "Type", value: project.tag },
    { label: "Year", value: project.year },
    { label: "Location", value: project.location },
    { label: "Area", value: project.area },
  ].filter((m) => m.value);

  return (
    <article className="bg-paper">
      {/* Header */}
      <section className="shell pt-32 lg:pt-40">
        <Link
          to="/portfolio"
          className="link-underline inline-flex items-center gap-2 text-sm font-medium text-stone hover:text-ink"
        >
          <FiArrowLeft /> All projects
        </Link>

        <div className="mt-8 flex flex-col gap-6 border-b border-line pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="eyebrow mb-5"
            >
              {project.tag}
            </motion.span>
            <h1 className="display text-5xl sm:text-6xl lg:text-[5rem]">
              <span className="block overflow-hidden">
                <motion.span
                  initial="hidden"
                  animate="visible"
                  variants={clipUp}
                  transition={{ duration: 1, ease: EASE }}
                  className="block"
                >
                  {project.title}
                </motion.span>
              </span>
            </h1>
          </div>

          {meta.length > 0 && (
            <motion.dl
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
              className="grid grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-4 lg:flex lg:gap-10"
            >
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="text-xs uppercase tracking-widest text-stone">
                    {m.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg tracking-tightest">
                    {m.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          )}
        </div>
      </section>

      {/* Hero image */}
      <section className="shell mt-12">
        <Reveal variants={fadeUp} className="overflow-hidden rounded-3xl">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </Reveal>
      </section>

      {/* Description */}
      {project.description && (
        <section className="shell mt-16 max-w-3xl">
          <Reveal variants={fadeUp}>
            <p className="text-2xl leading-relaxed text-ink lg:text-3xl">
              {project.description}
            </p>
          </Reveal>
        </section>
      )}

      {/* Before / After */}
      {(project.beforeUrl || project.afterUrl) && (
        <section className="shell mt-20">
          <Reveal variants={fadeUp}>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-3xl tracking-tightest">
                Before <span className="italic text-accent">&amp;</span> after
              </h2>
              <p className="hidden text-sm text-stone sm:block">
                Drag the handle to compare
              </p>
            </div>
            <BeforeAfter
              before={project.beforeUrl}
              after={project.afterUrl || project.imageUrl}
            />
          </Reveal>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="shell mt-20">
          <Reveal
            variants={fadeUp}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {gallery.map((src, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl ${
                  i % 3 === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <img
                  src={src}
                  alt={`${project.title} ${i + 1}`}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-[1.4s] ease-smooth hover:scale-105"
                />
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* CTA + next */}
      <section className="shell mt-24 flex flex-col items-start justify-between gap-8 border-t border-line py-16 sm:flex-row sm:items-center">
        <Link
          to="/contact"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-medium text-paper transition-colors duration-500 hover:bg-accent-deep"
        >
          Start a project like this
          <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        {next && next.id !== project.id && (
          <button
            onClick={() => navigate(`/portfolio/${next.slug || next.id}`)}
            className="group text-right"
          >
            <span className="text-xs uppercase tracking-widest text-stone">
              Next project
            </span>
            <span className="mt-1 flex items-center gap-2 font-display text-2xl tracking-tightest">
              {next.title}
              <FiArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </button>
        )}
      </section>
    </article>
  );
};

export default ProjectPage;
