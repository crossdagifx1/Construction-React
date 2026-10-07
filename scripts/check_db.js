import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { order: "asc" }
    });
    console.log(`Found ${projects.length} projects in DB:`);
    projects.forEach(p => {
      console.log(`- [${p.id}] ${p.title} (${p.tag}) | Slug: ${p.slug}`);
    });
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
