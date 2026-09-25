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
  const projects = [
    { slug: "residence-1", title: "Residence #1", tag: "Residential", imageUrl: asset("residence-1-cover.jpg"), wide: true, year: "2024", location: "Atlas, Addis Ababa", area: "G+2+Terrace", beforeUrl: null, afterUrl: null, description: "A G+2+Terrace residence featuring minimalist design with white and light gray tones, a master bedroom with textured wall design, and an elegant reading nook.", gallery: [asset("residence-1-gallery-1.jpg"), asset("residence-1-gallery-2.jpg"), asset("residence-1-gallery-3.jpg"), asset("residence-1-gallery-4.jpg"), asset("residence-1-gallery-5.jpg"), asset("residence-1-gallery-6.jpg")] },
    { slug: "residence-2", title: "Residence #2", tag: "Residential", imageUrl: asset("residence-2-cover.jpg"), wide: false, year: "2024", location: "Goro, Addis Ababa", area: "G+4+Terrace", beforeUrl: null, afterUrl: null, description: "G+4+Terrace residence with modern, light-filled patio space transitioning into the interior. Includes a home theatre with a deep purple color scheme and starry ceiling.", gallery: [asset("residence-2-gallery-1.jpg"), asset("residence-2-gallery-2.jpg"), asset("residence-2-gallery-3.jpg"), asset("residence-2-gallery-4.jpg"), asset("residence-2-gallery-5.jpg"), asset("residence-2-gallery-6.jpg"), asset("residence-2-gallery-7.jpg")] },
    { slug: "residence-3", title: "Residence #3", tag: "Residential", imageUrl: asset("residence-3-cover.jpg"), wide: false, year: "2023", location: "Ayat Condominium, Addis Ababa", area: "3 Bedroom", beforeUrl: null, afterUrl: null, description: "A 3-bedroom condominium utilizing natural wood textured materials, designed with focus on functional dining, living, and kitchen zones.", gallery: [asset("residence-3-gallery-1.jpg"), asset("residence-3-gallery-2.jpg"), asset("residence-3-gallery-3.jpg")] },
    { slug: "residence-4", title: "Residence #4", tag: "Residential", imageUrl: asset("residence-4-cover.jpg"), wide: true, year: "2024", location: "Sumit, Addis Ababa", area: "G+2+Terrace", beforeUrl: null, afterUrl: null, description: "A luxury G+2+Terrace residence with a white color theme, featuring a mezzanine floor and an exposed staircase.", gallery: [asset("residence-4-gallery-1.jpg"), asset("residence-4-gallery-2.jpg"), asset("residence-4-gallery-3.jpg")] },
    { slug: "residence-5", title: "Residence #5", tag: "Residential", imageUrl: asset("residence-5-cover.jpg"), wide: true, year: "2024", location: "Mekele, Ethiopia", area: "G+2+Terrace", beforeUrl: null, afterUrl: null, description: "Modern G+2+Terrace living room with minimalist white and light gray tones, including a children's gaming family room and an asymmetrical black and white facade.", gallery: [asset("residence-5-gallery-1.jpg"), asset("residence-5-gallery-2.jpg"), asset("residence-5-gallery-3.jpg")] },
    { slug: "barber-shop-1", title: "Barber Shop #1", tag: "Commercial", imageUrl: asset("barber-shop-1-cover.jpg"), wide: false, year: "2023", location: "Tuli Dimtu, Addis Ababa", area: "120 m²", beforeUrl: null, afterUrl: null, description: "A modern men's barber shop with a sleek black and white theme. White is utilized for walls to enhance light, complemented by custom black furniture.", gallery: [asset("barber-shop-1-gallery-1.jpg"), asset("barber-shop-1-gallery-2.jpg"), asset("barber-shop-1-gallery-3.jpg")] },
    { slug: "barber-shop-2", title: "Barber Shop #2", tag: "Commercial", imageUrl: asset("barber-shop-2-cover.jpg"), wide: false, year: "2024", location: "Summit, Addis Ababa", area: "90 m²", beforeUrl: null, afterUrl: null, description: "A modern men's barber shop design with a clearly defined and easy circulation providing privacy for washing and scrub-up spaces.", gallery: [asset("barber-shop-2-gallery-1.jpg"), asset("barber-shop-2-gallery-2.jpg"), asset("barber-shop-2-gallery-3.jpg")] },
    { slug: "nail-salon-1", title: "Nail Salon #1", tag: "Commercial", imageUrl: asset("nail-salon-1-cover.jpg"), wide: false, year: "2023", location: "Mekele, Ethiopia", area: "75 m²", beforeUrl: null, afterUrl: null, description: "Cost-effective & minimalistic nail salon featuring a vibrant pink and white color theme, customized for a modern and clean aesthetic.", gallery: [asset("nail-salon-1-gallery-1.jpg"), asset("nail-salon-1-gallery-2.jpg"), asset("nail-salon-1-gallery-3.jpg"), asset("nail-salon-1-gallery-4.jpg")] },
    { slug: "hospital-design", title: "Hospital Design", tag: "Commercial", imageUrl: asset("hospital-design-cover.jpg"), wide: true, year: "2025", location: "4 Kilo, Addis Ababa", area: "Clinic & Ward", beforeUrl: null, afterUrl: null, description: "A modern hospital design prioritizing patient needs and comfort. Features clinical layouts for physiotherapy, inpatient wards, laboratory, and nurse stations.", gallery: [asset("hospital-design-gallery-1.jpg"), asset("hospital-design-gallery-2.jpg"), asset("hospital-design-gallery-3.jpg"), asset("hospital-design-gallery-4.jpg"), asset("hospital-design-gallery-5.jpg"), asset("hospital-design-gallery-6.jpg"), asset("hospital-design-gallery-7.jpg"), asset("hospital-design-gallery-8.jpg"), asset("hospital-design-gallery-9.jpg"), asset("hospital-design-gallery-10.jpg")] },
    { slug: "shiro-restaurant", title: "Shiro Restaurant", tag: "Hospitality", imageUrl: asset("shiro-restaurant-cover.jpg"), wide: false, year: "2023", location: "Tuli Dimtu, Addis Ababa", area: "210 m²", beforeUrl: null, afterUrl: null, description: "A restaurant design optimized to maximize seating capacity, using colors and materials that complement the theme and target audience.", gallery: [asset("shiro-restaurant-gallery-1.jpg"), asset("shiro-restaurant-gallery-2.jpg"), asset("shiro-restaurant-gallery-3.jpg")] },
    { slug: "decor-shop", title: "Decor Shop", tag: "Commercial", imageUrl: asset("decor-shop-cover.jpg"), wide: false, year: "2024", location: "Bole Reality Plaza, Addis Ababa", area: "150 m²", beforeUrl: null, afterUrl: null, description: "A white-themed decor shop designed to showcase sample decorating elements in a clean, high-end display environment.", gallery: [asset("decor-shop-gallery-1.jpg"), asset("decor-shop-gallery-2.jpg"), asset("decor-shop-gallery-3.jpg"), asset("decor-shop-gallery-4.jpg")] },
    { slug: "renovation-1", title: "Renovation #1", tag: "Residential", imageUrl: asset("renovation-1-cover.jpg"), wide: true, year: "2024", location: "Meri Loqe, Addis Ababa", area: "G+1 Renovation", beforeUrl: asset("renovation-1-before.jpg"), afterUrl: asset("renovation-1-after.jpg"), description: "Full G+1 renovation turning a traditional space into a modern residence with a white theme and custom black-toned furniture.", gallery: [asset("renovation-1-gallery-1.jpg"), asset("renovation-1-gallery-2.jpg"), asset("renovation-1-gallery-3.jpg")] },
    { slug: "renovation-2", title: "Renovation #2", tag: "Residential", imageUrl: asset("renovation-2-cover.jpg"), wide: false, year: "2023", location: "Ayat, Addis Ababa", area: "G+1 Renovation", beforeUrl: asset("renovation-2-before.jpg"), afterUrl: asset("renovation-2-after.jpg"), description: "Modern minimalist G+1 renovation featuring a neutral palette, white sectional sofa, custom wood-paneled TV wall, and a clean monochromatic bathroom.", gallery: [asset("renovation-2-gallery-1.jpg"), asset("renovation-2-gallery-2.jpg"), asset("renovation-2-gallery-3.jpg")] },
    { slug: "renovation-3", title: "Renovation #3", tag: "Residential", imageUrl: asset("renovation-3-cover.jpg"), wide: false, year: "2024", location: "Bole Bulbula, Addis Ababa", area: "G+1 Renovation", beforeUrl: asset("renovation-3-before.jpg"), afterUrl: asset("renovation-3-after.jpg"), description: "A classic modern G+1 renovation featuring open floor plans, neutral color palettes, and natural materials like wood. Updates include master bedroom, dining, and open kitchen.", gallery: [asset("renovation-3-gallery-1.jpg"), asset("renovation-3-gallery-2.jpg"), asset("renovation-3-gallery-3.jpg")] },
    { slug: "renovation-4", title: "Renovation #4", tag: "Residential", imageUrl: asset("renovation-4-cover.jpg"), wide: true, year: "2024", location: "Semit, Addis Ababa", area: "G+2+Terrace", beforeUrl: asset("renovation-4-before.jpg"), afterUrl: asset("renovation-4-after.jpg"), description: "Comprehensive renovation of a G+2 residence, optimizing both interior layouts and exterior facades.", gallery: [] },
    { slug: "renovation-5", title: "Renovation #5", tag: "Residential", imageUrl: asset("renovation-5-cover.jpg"), wide: true, year: "2024", location: "Asko, Addis Ababa", area: "G+1 Residence", beforeUrl: null, afterUrl: null, description: "G+1 residence exterior renovation introducing an asymmetrical black and white facade with linear aluminum profile lighting and integrated greeneries.", gallery: [asset("renovation-5-gallery-1.jpg"), asset("renovation-5-gallery-2.jpg")] },
    { slug: "hidmo-traditional-house", title: "Hidmo Traditional House", tag: "Residential", imageUrl: asset("hidmo-traditional-house-cover.jpg"), wide: true, year: "2025", location: "Tigray, Ethiopia", area: "Traditional House", beforeUrl: null, afterUrl: null, description: "Innovative design of a modern vernacular Hidmo house, blending traditional architectural heritage with contemporary materials.", gallery: [asset("hidmo-traditional-house-gallery-1.jpg"), asset("hidmo-traditional-house-gallery-2.jpg"), asset("hidmo-traditional-house-gallery-3.jpg")] },
    { slug: "g1-gojo-design", title: "G+1 Gojo Design", tag: "Residential", imageUrl: asset("g1-gojo-design-cover.jpg"), wide: false, year: "2024", location: "Addis Ababa", area: "G+1 Villa", beforeUrl: null, afterUrl: null, description: "Innovative modern vernacular design for a G+1 residence inspired by the traditional Ethiopian Gojo structure.", gallery: [asset("g1-gojo-design-gallery-1.jpg"), asset("g1-gojo-design-gallery-2.jpg"), asset("g1-gojo-design-gallery-3.jpg"), asset("g1-gojo-design-gallery-4.jpg")] },
    { slug: "mezzanine-villa", title: "Mezzanine Villa", tag: "Residential", imageUrl: asset("mezzanine-villa-cover.jpg"), wide: true, year: "2024", location: "Addis Ababa", area: "Mezzanine Villa", beforeUrl: null, afterUrl: null, description: "A Mezzanine villa design that enhances a conventional G+0 villa by introducing form hierarchy and stunning high ceilings in the living areas.", gallery: [asset("mezzanine-villa-gallery-1.jpg"), asset("mezzanine-villa-gallery-2.jpg"), asset("mezzanine-villa-gallery-3.jpg"), asset("mezzanine-villa-gallery-4.jpg"), asset("mezzanine-villa-gallery-5.jpg"), asset("mezzanine-villa-gallery-6.jpg")] },
  ];
  await prisma.project.deleteMany();
  await prisma.project.createMany({
    data: projects.map((p, i) => ({
      ...p,
      order: i,
      slug: p.slug || slugify(p.title),
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
