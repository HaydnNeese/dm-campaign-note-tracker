const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'test@example.com' },
    data: { isPremium: true }
  });
  console.log('User updated:', user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
