import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Image paths are served from the frontend /src/assets via the build; for seed we
// store the public-facing asset path. The admin can later replace these with
// uploaded Supabase Storage URLs.
const asset = (name) => `/assets/${name}`;

async function main() {
  // ── Admin ─────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL || "admin@havisdesign.com";
  const password = process.env.ADMIN_PASSWORD || "changeme";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "HAVI Admin" },
  });
  console.log(`✓ Admin seeded: ${email}`);

  // ── Settings (grouped JSON) ───────────────────────────
  const settings = {
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
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("✓ Settings seeded");

  // ── Services ──────────────────────────────────────────
  const services = [
    { icon: "FiPenTool", title: "Interior Design", about: "Bespoke interiors that balance comfort, elegance and function — tailored to how you live and work." },
    { icon: "FiGrid", title: "Space Planning", about: "Considered layouts that make every square metre purposeful, with light and flow at the centre." },
    { icon: "FiBox", title: "Custom Furniture", about: "Made-to-measure joinery and furniture crafted with skilled artisans and refined materials." },
    { icon: "FiLayers", title: "Material Selection", about: "Curated palettes of finishes, textures and tones sourced from top-tier suppliers." },
    { icon: "FiTool", title: "High-end Finishing", about: "Meticulous detailing and finishing that elevate a space into something timeless." },
    { icon: "FiHome", title: "Renovation & Fit-out", about: "Turnkey renovation and fit-out, managed end-to-end for a seamless, on-time delivery." },
  ];
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: services.map((s, i) => ({ ...s, order: i })),
  });
  console.log("✓ Services seeded");

  // ── Process steps ─────────────────────────────────────
  const steps = [
    { icon: "FiSearch", step: "01", title: "Discover", about: "We listen, measure and research — establishing goals, requirements and a clear brief." },
    { icon: "FiCompass", step: "02", title: "Design", about: "Concepts, mood boards and 3D visuals that bring a considered, user-centred vision to life." },
    { icon: "FiTool", step: "03", title: "Build", about: "Skilled artisans execute with precision, keeping craft and detail at the forefront." },
    { icon: "FiCheckCircle", step: "04", title: "Finish", about: "Styling, snagging and handover — a flawless space, delivered and ready to enjoy." },
  ];
  await prisma.processStep.deleteMany();
  await prisma.processStep.createMany({
    data: steps.map((s, i) => ({ ...s, order: i })),
  });
  console.log("✓ Process steps seeded");

  // ── Projects ──────────────────────────────────────────
  const slugify = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  const desc =
    "A full interior transformation by HAVI'S DESIGN — reworking the layout, light and materials to create a space that is both functional and timeless. Custom joinery, considered finishes and careful detailing throughout.";
  const projects = [
    { title: "Aria Residence", tag: "Residential", imageUrl: asset("project1.jpg"), wide: true, beforeUrl: asset("project6.jpg"), afterUrl: asset("project1.jpg"), year: "2024", location: "Addis Ababa", area: "240 m²" },
    { title: "Lumen Office", tag: "Commercial", imageUrl: asset("project2.jpg"), wide: false, beforeUrl: asset("project5.jpg"), afterUrl: asset("project2.jpg"), year: "2023", location: "Addis Ababa", area: "520 m²" },
    { title: "Maison Suite", tag: "Hospitality", imageUrl: asset("project3.jpg"), wide: false, beforeUrl: asset("project4.jpg"), afterUrl: asset("project3.jpg"), year: "2024", location: "Bishoftu", area: "180 m²" },
    { title: "Onyx Lounge", tag: "Hospitality", imageUrl: asset("project4.jpg"), wide: true, beforeUrl: asset("project8.jpg"), afterUrl: asset("project4.jpg"), year: "2022", location: "Addis Ababa", area: "310 m²" },
    { title: "Sered Loft", tag: "Residential", imageUrl: asset("project6.jpg"), wide: true, beforeUrl: asset("project2.jpg"), afterUrl: asset("project6.jpg"), year: "2023", location: "Hawassa", area: "150 m²" },
    { title: "Vista Retail", tag: "Commercial", imageUrl: asset("project8.jpg"), wide: false, beforeUrl: asset("project3.jpg"), afterUrl: asset("project8.jpg"), year: "2024", location: "Addis Ababa", area: "420 m²" },
  ];
  await prisma.project.deleteMany();
  await prisma.project.createMany({
    data: projects.map((p, i) => ({
      ...p,
      order: i,
      slug: slugify(p.title),
      description: desc,
      gallery: [p.imageUrl, p.beforeUrl, p.afterUrl],
    })),
  });
  console.log("✓ Projects seeded");

  // ── Testimonials ──────────────────────────────────────
  const testimonials = [
    { name: "Alex Parker", post: "Residential Client", imageUrl: asset("client1.png"), quote: "HAVI'S DESIGN reimagined our home with a calm, timeless palette. Every detail was considered and the finish is impeccable." },
    { name: "Drew James", post: "Hospitality Director", imageUrl: asset("client2.png"), quote: "From planning to handover the process was seamless. The space feels elevated yet effortless — exactly what we wanted." },
    { name: "Sam Peterson", post: "Office Owner", imageUrl: asset("client3.png"), quote: "Craftsmanship you can feel. The team balanced function and beauty and delivered ahead of schedule." },
  ];
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: testimonials.map((t, i) => ({ ...t, order: i })),
  });
  console.log("✓ Testimonials seeded");
}

main()
  .then(() => console.log("\n✅ Seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
