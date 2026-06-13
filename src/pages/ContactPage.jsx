import PageHero from "../components/PageHero";
import Contact from "../sections/Contact";

const ContactPage = () => (
  <>
    <PageHero
      eyebrow="Get in touch"
      title="Let's start"
      accent="a conversation."
      subtitle="Whether it's a luxury home, a stylish office or a vibrant retail space — tell us about your project and we'll be in touch."
    />
    <Contact />
  </>
);

export default ContactPage;
