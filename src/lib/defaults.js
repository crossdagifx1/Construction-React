// Fallback content used when the API/DB is unavailable, so the public site always
// renders. Mirrors prisma/seed.js. Once the DB is connected, live data takes over.

const asset = (n) => `/assets/${n}`;

const DESC =
  "A full interior transformation by HAVI'S DESIGN — reworking the layout, light and materials to create a space that is both functional and timeless. Custom joinery, considered finishes and careful detailing throughout.";

export const DEFAULT_SITE = {
  settings: {
    hero: {
      eyebrow: "Interior Design & Finishing Studio",
      titleLine1: "We shape",
      titleLine2: "spaces that",
      titleAccent: "feel like home.",
      subtitle:
        "HAVI'S DESIGN transforms residential, commercial and hospitality interiors into functional, aesthetic and timeless environments — crafted with precision and care.",
      image: asset("hero.png"),
      statValue: "120+",
      statLabel: "Spaces delivered",
    },
    about: {
      eyebrow: "Who we are",
      heading: "A studio devoted to {craftsmanship} and quiet luxury.",
      body1:
        "With a passion for creativity and a keen eye for detail, we deliver bespoke design for residential, commercial and hospitality projects. We prioritise quality craftsmanship and seamless execution, working with skilled artisans and top-tier suppliers to bring designs to life.",
      body2:
        "From space planning to custom furniture and high-end finishing, every project is tailored to enhance comfort, elegance and function.",
      image1: asset("project3.jpg"),
      image2: asset("project5.jpg"),
      since: "Since 2014",
      stats: [
        { value: 12, suffix: "+", label: "Years of practice" },
        { value: 120, suffix: "+", label: "Spaces delivered" },
        { value: 40, suffix: "+", label: "Skilled artisans" },
        { value: 98, suffix: "%", label: "Client retention" },
      ],
    },
    contact: {
      eyebrow: "Let's talk",
      heading: "Tell us about your {space.}",
      blurb:
        "Share a few details and we'll get back within two working days to discuss your project, timeline and ideas.",
      phone: "+251 906 147 734",
      phoneHref: "tel:+251906147734",
      email: "info@havisdesign.com",
      address: "Addis Ababa, Ethiopia",
    },
    marquee: {
      items: [
        "Interior Design",
        "Space Planning",
        "Custom Furniture",
        "Material Selection",
        "High-end Finishing",
        "Renovation",
        "Turnkey Fit-out",
      ],
    },
  },
  services: [
    { id: "d1", icon: "FiPenTool", title: "Interior Design", about: "Bespoke interiors that balance comfort, elegance and function — tailored to how you live and work." },
    { id: "d2", icon: "FiGrid", title: "Space Planning", about: "Considered layouts that make every square metre purposeful, with light and flow at the centre." },
    { id: "d3", icon: "FiBox", title: "Custom Furniture", about: "Made-to-measure joinery and furniture crafted with skilled artisans and refined materials." },
    { id: "d4", icon: "FiLayers", title: "Material Selection", about: "Curated palettes of finishes, textures and tones sourced from top-tier suppliers." },
    { id: "d5", icon: "FiTool", title: "High-end Finishing", about: "Meticulous detailing and finishing that elevate a space into something timeless." },
    { id: "d6", icon: "FiHome", title: "Renovation & Fit-out", about: "Turnkey renovation and fit-out, managed end-to-end for a seamless, on-time delivery." },
  ],
  steps: [
    { id: "s1", icon: "FiSearch", step: "01", title: "Discover", about: "We listen, measure and research — establishing goals, requirements and a clear brief." },
    { id: "s2", icon: "FiCompass", step: "02", title: "Design", about: "Concepts, mood boards and 3D visuals that bring a considered, user-centred vision to life." },
    { id: "s3", icon: "FiTool", step: "03", title: "Build", about: "Skilled artisans execute with precision, keeping craft and detail at the forefront." },
    { id: "s4", icon: "FiCheckCircle", step: "04", title: "Finish", about: "Styling, snagging and handover — a flawless space, delivered and ready to enjoy." },
  ],
  projects: [
    { id: "p1", slug: "aria-residence", title: "Aria Residence", tag: "Residential", imageUrl: asset("project1.jpg"), wide: true, year: "2024", location: "Addis Ababa", area: "240 m²", beforeUrl: asset("project6.jpg"), afterUrl: asset("project1.jpg"), description: DESC, gallery: [asset("project1.jpg"), asset("project6.jpg")] },
    { id: "p2", slug: "lumen-office", title: "Lumen Office", tag: "Commercial", imageUrl: asset("project2.jpg"), wide: false, year: "2023", location: "Addis Ababa", area: "520 m²", beforeUrl: asset("project5.jpg"), afterUrl: asset("project2.jpg"), description: DESC, gallery: [asset("project2.jpg"), asset("project5.jpg")] },
    { id: "p3", slug: "maison-suite", title: "Maison Suite", tag: "Hospitality", imageUrl: asset("project3.jpg"), wide: false, year: "2024", location: "Bishoftu", area: "180 m²", beforeUrl: asset("project4.jpg"), afterUrl: asset("project3.jpg"), description: DESC, gallery: [asset("project3.jpg"), asset("project4.jpg")] },
    { id: "p4", slug: "onyx-lounge", title: "Onyx Lounge", tag: "Hospitality", imageUrl: asset("project4.jpg"), wide: true, year: "2022", location: "Addis Ababa", area: "310 m²", beforeUrl: asset("project8.jpg"), afterUrl: asset("project4.jpg"), description: DESC, gallery: [asset("project4.jpg"), asset("project8.jpg")] },
    { id: "p5", slug: "sered-loft", title: "Sered Loft", tag: "Residential", imageUrl: asset("project6.jpg"), wide: true, year: "2023", location: "Hawassa", area: "150 m²", beforeUrl: asset("project2.jpg"), afterUrl: asset("project6.jpg"), description: DESC, gallery: [asset("project6.jpg"), asset("project2.jpg")] },
    { id: "p6", slug: "vista-retail", title: "Vista Retail", tag: "Commercial", imageUrl: asset("project8.jpg"), wide: false, year: "2024", location: "Addis Ababa", area: "420 m²", beforeUrl: asset("project3.jpg"), afterUrl: asset("project8.jpg"), description: DESC, gallery: [asset("project8.jpg"), asset("project3.jpg")] },
  ],
  testimonials: [
    { id: "t1", name: "Alex Parker", post: "Residential Client", imageUrl: asset("client1.png"), quote: "HAVI'S DESIGN reimagined our home with a calm, timeless palette. Every detail was considered and the finish is impeccable." },
    { id: "t2", name: "Drew James", post: "Hospitality Director", imageUrl: asset("client2.png"), quote: "From planning to handover the process was seamless. The space feels elevated yet effortless — exactly what we wanted." },
    { id: "t3", name: "Sam Peterson", post: "Office Owner", imageUrl: asset("client3.png"), quote: "Craftsmanship you can feel. The team balanced function and beauty and delivered ahead of schedule." },
  ],
};
