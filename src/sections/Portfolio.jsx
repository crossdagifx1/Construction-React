import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";

// `limit` lets the home page show a teaser; the portfolio page shows all.
const Portfolio = ({ limit, showCta = true }) => {
  const { data } = useSiteData();
  const all = data.projects || [];
  const projects = limit ? all.slice(0, limit) : all;

  return (
    <section id="projects" className="bg-ink py-24 text-paper lg:py-32">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal variants={fadeUp}>
              <span className="eyebrow mb-6 text-accent">Selected work</span>
            </Reveal>
            <AnimatedHeading
              text="Spaces we're {proud} of."
              className="display text-4xl text-paper sm:text-5xl lg:text-[3.4rem]"
            />
          </div>
          {showCta && (
            <Reveal variants={fadeUp} delay={0.1}>
              <Link
                to="/portfolio"
                className="group inline-flex items-center gap-2 text-sm font-medium text-paper/80 transition-colors hover:text-paper"
              >
                View all projects
                <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Reveal>
          )}
        </div>

        <Reveal
          variants={stagger}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((p) => (
            <motion.article
              key={p.id || p.title}
              variants={fadeUp}
              className={`group relative overflow-hidden rounded-2xl ${
                p.wide ? "lg:col-span-2" : ""
              }`}
            >
              <Link to={`/portfolio/${p.slug || p.id}`} className="block">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-[1.4s] ease-smooth group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div className="translate-y-2 transition-transform duration-500 ease-smooth group-hover:translate-y-0">
                    <p className="text-xs uppercase tracking-widest text-accent">
                      {p.tag}
                    </p>
                    <h3 className="mt-1 font-display text-2xl tracking-tightest text-paper">
                      {p.title}
                    </h3>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-paper opacity-0 transition-all duration-500 ease-smooth group-hover:bg-paper group-hover:text-ink group-hover:opacity-100">
                    <FiArrowUpRight size={20} />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Portfolio;
