import "dotenv/config"; // must load before PrismaClient is constructed
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { PrismaClient } from "@prisma/client";

// Get and process the connection string
let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  // Ensure connection pool limits and timeouts to prevent connection exhaustion on Hostinger
  if (!databaseUrl.includes("connection_limit")) {
    const sep = databaseUrl.includes("?") ? "&" : "?";
    databaseUrl = `${databaseUrl}${sep}connection_limit=5&connect_timeout=15`;
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

