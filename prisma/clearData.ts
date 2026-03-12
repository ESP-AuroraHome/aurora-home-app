import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.dataPoint.count();
  console.log("DataPoints avant purge:", count);
  const deleted = await prisma.dataPoint.deleteMany();
  console.log("DataPoints supprimés:", deleted.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
