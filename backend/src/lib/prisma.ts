import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance
const prisma = new PrismaClient();

export default prisma;
