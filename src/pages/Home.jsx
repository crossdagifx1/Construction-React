import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../sections/Hero";
import Marquee from "../sections/Marquee";
import About from "../sections/About";
import Services from "../sections/Services";
import Working from "../sections/Working";
import Portfolio from "../sections/Portfolio";
import Testimonials from "../sections/Testimonials";
import Contact from "../sections/Contact";

const Home = () => {
  const { hash } = useLocation();

  // Scroll to a section when arriving with a #hash (e.g. /#services).
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      // small delay so layout/animations settle
      setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [hash]);

  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Working />
      <Portfolio limit={4} />
      <Testimonials />
      <Contact />
    </>
  );
};

export default Home;
