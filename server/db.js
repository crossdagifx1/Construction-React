import "dotenv/config"; // must load before PrismaClient is constructed
import { PrismaClient } from "@prisma/client";

// Limit connection pool to avoid exhausting Supabase session pooler (max 15 sessions).
// The connection_limit in DATABASE_URL is the primary control; this is a belt-and-suspenders guard.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Gracefully disconnect on server shutdown so connections are returned to the pool.
const gracefulDisconnect = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", gracefulDisconnect);
process.on("SIGTERM", gracefulDisconnect);

export default prisma;

