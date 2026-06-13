import PageHero from "../components/PageHero";
import About from "../sections/About";
import Working from "../sections/Working";
import Marquee from "../sections/Marquee";
import Testimonials from "../sections/Testimonials";

const AboutPage = () => (
  <>
    <PageHero
      eyebrow="About the studio"
      title="Designing interiors"
      accent="that endure."
      subtitle="HAVI'S DESIGN is a premier interior design and finishing firm dedicated to transforming spaces into functional, aesthetic and timeless environments."
    />
    <Marquee />
    <About />
    <Working />
    <Testimonials />
  </>
);

export default AboutPage;
