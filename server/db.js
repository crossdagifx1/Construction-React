import "dotenv/config"; // must load before PrismaClient is constructed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
