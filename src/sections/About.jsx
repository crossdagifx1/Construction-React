import Reveal from "../components/Reveal";
import Counter from "../components/Counter";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";

const About = () => {
  const { data } = useSiteData();
  const about = data.settings.about;
  const stats = about.stats || [];

  return (
    <section id="about" className="shell py-24 lg:py-32">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal variants={fadeUp} className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-3xl">
            <img
              src={about.image1}
              alt="Finished interior by HAVI'S DESIGN"
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] ease-smooth hover:scale-105"
            />
          </div>
          <div className="absolute -bottom-8 -right-2 w-2/5 overflow-hidden rounded-2xl border-4 border-paper shadow-xl lg:-right-8">
            <img
              src={about.image2}
              alt="Detail of a crafted finish"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="absolute -left-3 top-8 hidden rounded-2xl bg-ink px-5 py-4 text-paper shadow-xl lg:block">
            <p className="font-display text-2xl tracking-tightest">HD</p>
            <p className="text-[10px] uppercase tracking-widest text-paper/70">
              {about.since}
            </p>
          </div>
        </Reveal>

        <div className="order-1 flex flex-col justify-center lg:order-2">
          <Reveal variants={fadeUp}>
            <span className="eyebrow mb-6">{about.eyebrow}</span>
          </Reveal>

          <AnimatedHeading
            text={about.heading}
            className="display text-4xl sm:text-5xl lg:text-[3.4rem]"
          />

          <Reveal variants={fadeUp} delay={0.1}>
            <p className="mt-7 text-lg leading-relaxed text-stone">{about.body1}</p>
          </Reveal>
          <Reveal variants={fadeUp} delay={0.15}>
            <p className="mt-4 text-lg leading-relaxed text-stone">{about.body2}</p>
          </Reveal>

          <Reveal
            variants={stagger}
            className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line pt-10 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <Reveal key={s.label} variants={fadeUp}>
                <p className="font-display text-4xl tracking-tightest text-ink lg:text-5xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-xs uppercase tracking-widest text-stone">
                  {s.label}
                </p>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default About;
