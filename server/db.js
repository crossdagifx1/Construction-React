import "dotenv/config"; // must load before PrismaClient is constructed
import { PrismaClient } from "@prisma/client";

// Get and process the connection string
let databaseUrl = process.env.DATABASE_URL;

if (process.env.VERCEL && databaseUrl) {
  // On Vercel (production serverless), redirect connection to port 6543 (transaction mode pooler)
  // to prevent connection exhaustion under scale.
  if (databaseUrl.includes(":5432")) {
    databaseUrl = databaseUrl.replace(":5432", ":6543");
    if (!databaseUrl.includes("pgbouncer=true")) {
      const sep = databaseUrl.includes("?") ? "&" : "?";
      databaseUrl = `${databaseUrl}${sep}pgbouncer=true`;
    }
  }
}

// Global cache pattern for serverless warm starts
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["warn", "error"],
      ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    });
  }
  prisma = global.prisma;
}

// Gracefully disconnect on server shutdown so connections are returned to the pool.
const gracefulDisconnect = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", gracefulDisconnect);
process.on("SIGTERM", gracefulDisconnect);

export default prisma;

