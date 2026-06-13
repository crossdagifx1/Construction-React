import { motion } from "framer-motion";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";
import { getIcon } from "../lib/icons";

const Services = () => {
  const { data } = useSiteData();
  const services = data.services || [];

  return (
    <section id="services" className="bg-sand py-24 lg:py-32">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal variants={fadeUp}>
              <span className="eyebrow mb-6">What we do</span>
            </Reveal>
            <AnimatedHeading
              text="Services built around {your} space."
              className="display text-4xl sm:text-5xl lg:text-[3.4rem]"
            />
          </div>
          <Reveal variants={fadeUp} delay={0.1}>
            <p className="max-w-sm text-stone">
              A complete studio offering — from first sketch to final styling —
              under one roof.
            </p>
          </Reveal>
        </div>

        <Reveal
          variants={stagger}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <motion.article
                key={service.id || index}
                variants={fadeUp}
                className="group relative bg-paper p-9 transition-colors duration-500 ease-smooth hover:bg-ink"
              >
                <span className="font-display text-sm text-stone transition-colors duration-500 group-hover:text-paper/50">
                  0{index + 1}
                </span>
                <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-full border border-line text-ink transition-all duration-500 ease-smooth group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                  <Icon size={24} />
                </div>
                <h3 className="mt-7 font-display text-2xl tracking-tightest text-ink transition-colors duration-500 group-hover:text-paper">
                  {service.title}
                </h3>
                <p className="mt-3 leading-relaxed text-stone transition-colors duration-500 group-hover:text-paper/70">
                  {service.about}
                </p>
              </motion.article>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};

export default Services;
