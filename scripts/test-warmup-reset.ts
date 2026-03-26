/**
 * Remet la DB dans un état de chauffe : supprime tous les DataPoints
 * pour que le banner "Aurora observe votre environnement" s'affiche.
 *
 * Usage : npm run test-warmup-reset
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.dataPoint.deleteMany({});
  console.log(`✅ ${deleted.count} DataPoints supprimés — app en état de chauffe`);
  console.log("   Rechargez le dashboard pour voir le banner de chauffe.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
