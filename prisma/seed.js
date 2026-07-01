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
    create: { email, passwordHash, name: "HAVI Admin", role: "ADMIN" },
  });
  console.log(`✓ Admin seeded: ${email}`);

  // ── Technical Admin ─────────────────────────────────
  const techEmail = process.env.TECH_ADMIN_EMAIL || "techadmin@havisdesign.sys";
  const techPassword = process.env.TECH_ADMIN_PASSWORD || "H@v!T3ch#2026$X9zQp";
  const techHash = await bcrypt.hash(techPassword, 12);
  const { randomUUID } = await import("crypto");
  await prisma.admin.upsert({
    where: { email: techEmail },
    update: { passwordHash: techHash },
    create: {
      email: techEmail,
      passwordHash: techHash,
      name: "Technical Administrator",
      role: "TECHNICAL_ADMIN",
      superKey: randomUUID(),
    },
  });
  console.log(`✓ Technical Admin seeded: ${techEmail}`);

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

  // ── Blogs ──────────────────────────────────────────────
  const blogs = [
    {
      slug: "art-of-quiet-luxury",
      title: "The Art of Quiet Luxury in Modern Interiors",
      excerpt: "Quiet luxury is more than a trend; it's a design philosophy centered on refinement, material honesty, and thoughtful detail.",
      content: "<p>Quiet luxury represents a shift away from flashy, superficial design toward spaces that whisper elegance rather than shout. In the world of interior finishing, this means prioritizing natural materials, custom carpentry, and bespoke details that stand the test of time.</p><p>Key elements of this design philosophy include:</p><ul><li><strong>Material Honesty:</strong> Using genuine wood, solid stone, and high-quality textiles rather than artificial substitutes.</li><li><strong>Custom Joinery:</strong> Designing millwork that integrates seamlessly into the architecture, maximizing flow and functionality.</li><li><strong>Soft Textures:</strong> Combining neutral, warm plaster tones with bouclé, linen, and leather for touchable depth.</li></ul><p>Ultimately, a space designed with quiet luxury in mind feels calm, grounded, and inherently sophisticated.</p>",
      imageUrl: asset("project1.jpg"),
      category: "Trends",
      author: "HAVI's Studio",
      readTime: "4 min read",
      published: true
    },
    {
      slug: "choosing-perfect-material-palette",
      title: "Choosing the Perfect Material Palette for Your Home",
      excerpt: "A cohesive material palette binds a space together. Discover our expert guide on balancing wood tones, stone veining, and metallic accents.",
      content: "<p>Selecting finishes can be overwhelming. The secret is to establish a core material hierarchy: a primary neutral base, a supporting natural texture, and a high-contrast focal accent.</p><p>First, start with your flooring. In a luxury interior, large-format porcelain tiles or engineering hardwood lay the visual foundation. Next, choose your main vertical accents, such as custom wood cladding or fluted stone plaster. Finally, introduce fine jewelry for the room: brushed brass or matte black hardware, custom metal trims, and lighting accents.</p><p>Ensure you view all samples in the space's actual lighting. Natural light during the morning differs significantly from warm LED downlights at night. Take your time to test samples side-by-side to guarantee harmony.</p>",
      imageUrl: asset("project2.jpg"),
      category: "Guides",
      author: "Havi project lead",
      readTime: "5 min read",
      published: true
    },
    {
      slug: "case-study-lumen-office-makeover",
      title: "Case Study: Inside the Lumen Office Transformation",
      excerpt: "Go behind the scenes of our latest commercial project where we transformed a dark, cramped space into a luminous corporate headquarters.",
      content: "<p>Commercial interiors demand a balance between productivity, brand identity, and comfort. For the Lumen Office, our challenge was to build a space that fosters collaboration while maintaining dedicated zones for deep focus.</p><p>We started by knocking down non-load-bearing partitions to introduce a dynamic open-plan layout. To control sound, we integrated acoustic wood-slat panels along the main hallway. For lighting, we utilized recessed ceiling profiles that mimic natural daylight, reducing eye strain and elevating employee energy.</p><p>The result is a workplace that looks sleek, feels professional, and has boosted team collaboration by over 40%.</p>",
      imageUrl: asset("project3.jpg"),
      category: "Case Study",
      author: "HAVI Design Team",
      readTime: "6 min read",
      published: true
    }
  ];

  await prisma.blogPost.deleteMany();
  await prisma.blogPost.createMany({
    data: blogs.map((b, i) => ({ ...b, order: i })),
  });
  console.log("✓ Blogs seeded");

  // ── Ads ────────────────────────────────────────────────
  const ads = [
    {
      title: "Premium Italian Calacatta Porcelain Slab",
      type: "Material Supply",
      description: "Original 1200x2600mm porcelain slabs with high-definition Calacatta marble veining. Perfect for kitchen countertops, accent walls, and vanity splashbacks.",
      price: "ETB 14,500 / sqm",
      location: "Addis Ababa (Bole)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project1.jpg"),
      features: ["Stain resistant", "Heat resistant", "15mm thickness"],
      approved: true,
      featured: true
    },
    {
      title: "Heavy-Duty 350L Concrete Mixer Rental",
      type: "Machinery Rental",
      description: "Reliable diesel concrete mixer available for daily or weekly rent. Maintained in pristine condition, fuel-efficient, and delivered directly to your site.",
      price: "ETB 3,500 / day",
      location: "Addis Ababa (Gerji)",
      contactPhone: "+251995270894",
      contactEmail: "rentals@gnexuset.com",
      imageUrl: asset("project2.jpg"),
      features: ["Diesel engine", "350L capacity", "Delivery available"],
      approved: true,
      featured: false
    },
    {
      title: "1-on-1 Interior Styling & Mood Board Consultancy",
      type: "Interior Styling",
      description: "Get custom mood boards, 3D floor plan layout recommendations, and a complete material shopping list tailored to your residential space.",
      price: "ETB 25,000 / room",
      location: "Addis Ababa (Megenagna)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project3.jpg"),
      features: ["3D visualization", "Color consultation", "Material catalog"],
      approved: true,
      featured: true
    },
    {
      title: "Professional Gypsum Board Ceiling Installation",
      type: "Construction Contracting",
      description: "High-end gypsum board ceiling works including suspended frames, cove light channels, and immaculate joint sanding. Clean work guaranteed.",
      price: "ETB 1,800 / sqm",
      location: "Addis Ababa (CMC)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project4.jpg"),
      features: ["Premium boards used", "Integrated lighting prep", "Fast turnaround"],
      approved: true,
      featured: false
    },
    {
      title: "Custom Modern Residential Villa Blueprint Design",
      type: "Architectural Services",
      description: "Complete architectural drawings, structural calculations, and mechanical/electrical/plumbing (MEP) schematics ready for municipality approval.",
      price: "Negotiable",
      location: "Addis Ababa (Kazanchis)",
      contactPhone: "+251995270894",
      contactEmail: "design@gnexuset.com",
      imageUrl: asset("project5.jpg"),
      features: ["3D rendering included", "Municipality prep", "Site inspections"],
      approved: true,
      featured: false
    },
    {
      title: "Smart Home Automation Hub & App Integration",
      type: "Smart Home Installation",
      description: "Transform your home with smart switches, Alexa/Google Assistant hubs, security sensor integrations, and custom mood lighting scenes.",
      price: "Starting at ETB 90,000",
      location: "Addis Ababa (Bole Atlas)",
      contactPhone: "+251995270894",
      contactEmail: "smart@gnexuset.com",
      imageUrl: asset("project6.jpg"),
      features: ["Mobile app control", "Voice integration", "1-year warranty"],
      approved: true,
      featured: true
    },
    {
      title: "Lush Garden Design & Real Grass Turf Laying",
      type: "Landscaping & Gardens",
      description: "Complete landscape landscaping, soil preparation, local plant selection, and high-quality grass turf installation. Automated sprinkler setup optional.",
      price: "ETB 2,200 / sqm",
      location: "Bishoftu",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project8.jpg"),
      features: ["Real turf grass", "Sprinkler setup", "Soil conditioning"],
      approved: true,
      featured: false
    },
    {
      title: "PPR Heat-Fusion Piping System Fit-out",
      type: "Plumbing & Piping",
      description: "Certified plumbers for residential heat-fusion pipe layout. Pressure testing included to ensure 100% leak-proof kitchen and bathroom flow.",
      price: "Call for Quote",
      location: "Addis Ababa (Lebu)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project1.jpg"),
      features: ["Certified technicians", "Pressure testing", "High-grade PPR"],
      approved: true,
      featured: false
    },
    {
      title: "Three-Phase Distribution Board & Wiring",
      type: "Electrical Installations",
      description: "Professional industrial or residential three-phase wiring, circuit breaker installations, and surge protector fittings for full safety compliance.",
      price: "Negotiable",
      location: "Addis Ababa (Jeka)",
      contactPhone: "+251995270894",
      contactEmail: "tech@gnexuset.com",
      imageUrl: asset("project2.jpg"),
      features: ["Compliance certified", "Surge protection", "Load balanced"],
      approved: true,
      featured: false
    },
    {
      title: "Custom Oak Veneer Modular Kitchen Cabinets",
      type: "Custom Woodwork",
      description: "Custom-built modular kitchen layouts with oak wood veneer finishes, soft-close Blum drawer sliders, and integrated kitchen appliance slots.",
      price: "ETB 65,000 / meter",
      location: "Addis Ababa (Bole)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project3.jpg"),
      features: ["Modular design", "Soft-close hinges", "Oak wood veneer"],
      approved: true,
      featured: true
    },
    {
      title: "Modern Matte Black Balcony Railings",
      type: "Metal Fabrication",
      description: "Durable electrostatically powder-coated steel railings with custom geometric patterns. Corrosion-proof welding ready for outdoor balconies.",
      price: "ETB 8,500 / meter",
      location: "Addis Ababa (Gotera)",
      contactPhone: "+251906147734",
      contactEmail: "info@havisdesign.com",
      imageUrl: asset("project4.jpg"),
      features: ["Powder-coated finish", "Corrosion resistant", "Custom designs"],
      approved: true,
      featured: false
    }
  ];

  await prisma.adPost.deleteMany();
  await prisma.adPost.createMany({
    data: ads.map((a, i) => ({ ...a, order: i })),
  });
  console.log("✓ Ads seeded");
}

main()
  .then(() => console.log("\n✅ Seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
