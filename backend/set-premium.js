const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const result = await p.user.updateMany({ data: { isPremium: true } });
  console.log("Updated", result.count, "users to premium");
  const users = await p.user.findMany({ select: { id: true, email: true, isPremium: true } });
  console.table(users);
  await p.$disconnect();
}

main();
