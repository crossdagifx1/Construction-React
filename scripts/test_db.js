import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany();
  console.log("Database Projects count:", projects.length);
  console.log(projects.map(p => ({ id: p.id, title: p.title, imageUrl: p.imageUrl })));
  process.exit(0);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
