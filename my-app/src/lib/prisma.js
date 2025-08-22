import { PrismaClient } from "@prisma/client";

//globalThis is a global object, refers to things like windows in browser, global in nodejs
const globalForPrisma = globalThis;


export const prisma =

//check if we have a client in global already, if not create new prisma client. helps with hot-reloads so we dont create 1000 prisma clients.
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
