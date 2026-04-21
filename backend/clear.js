const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.sessionProcessResult.deleteMany().then(() => p.$disconnect());
