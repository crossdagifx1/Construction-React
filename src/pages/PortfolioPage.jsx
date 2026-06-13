import PageHero from "../components/PageHero";
import Portfolio from "../sections/Portfolio";
import Contact from "../sections/Contact";

const PortfolioPage = () => (
  <>
    <PageHero
      eyebrow="Our work"
      title="A portfolio of"
      accent="considered spaces."
      subtitle="A selection of residential, commercial and hospitality projects — each tailored to enhance comfort, elegance and function."
    />
    <Portfolio showCta={false} />
    <Contact />
  </>
);

export default PortfolioPage;
