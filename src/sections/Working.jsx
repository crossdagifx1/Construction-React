import { motion } from "framer-motion";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";
import { getIcon } from "../lib/icons";

const Working = () => {
  const { data } = useSiteData();
  const steps = data.steps || [];

  return (
    <section id="process" className="shell py-24 lg:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal variants={fadeUp}>
          <span className="eyebrow mb-6 justify-center">How we work</span>
        </Reveal>
        <AnimatedHeading
          text="A calm, considered {process.}"
          className="display justify-center text-center text-4xl sm:text-5xl lg:text-[3.4rem]"
        />
        <Reveal variants={fadeUp} delay={0.1}>
          <p className="mt-6 text-stone">
            Four clear stages keep every project transparent, on time and true
            to the original vision.
          </p>
        </Reveal>
      </div>

      <Reveal
        variants={stagger}
        className="relative mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
      >
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-line lg:block" />
        {steps.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <motion.div
              key={item.id || item.step}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper">
                <Icon size={22} />
              </div>
              <span className="mt-6 font-display text-sm tracking-widest text-accent-deep">
                {item.step}
              </span>
              <h3 className="mt-1 font-display text-2xl tracking-tightest">
                {item.title}
              </h3>
              <p className="mt-3 max-w-xs leading-relaxed text-stone">
                {item.about}
              </p>
            </motion.div>
          );
        })}
      </Reveal>
    </section>
  );
};

export default Working;
