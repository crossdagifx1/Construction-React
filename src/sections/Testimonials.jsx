import { motion } from "framer-motion";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";

const Testimonials = () => {
  const { data } = useSiteData();
  const clients = data.testimonials || [];

  return (
    <section id="clients" className="shell py-24 lg:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal variants={fadeUp}>
          <span className="eyebrow mb-6 justify-center">Kind words</span>
        </Reveal>
        <AnimatedHeading
          text="What our {clients} say."
          className="display justify-center text-center text-4xl sm:text-5xl lg:text-[3.4rem]"
        />
      </div>

      <Reveal
        variants={stagger}
        className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {clients.map((client) => (
          <motion.figure
            key={client.id || client.name}
            variants={fadeUp}
            className="flex flex-col rounded-3xl border border-line bg-paper p-8 transition-shadow duration-500 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
          >
            <span className="font-display text-6xl leading-none text-accent/40">
              &ldquo;
            </span>
            <blockquote className="-mt-4 flex-1 text-lg leading-relaxed text-ink">
              {client.quote}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
              {client.imageUrl && (
                <img
                  src={client.imageUrl}
                  alt={client.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-display text-lg tracking-tightest">
                  {client.name}
                </p>
                <p className="text-xs uppercase tracking-widest text-stone">
                  {client.post}
                </p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </Reveal>
    </section>
  );
};

export default Testimonials;
