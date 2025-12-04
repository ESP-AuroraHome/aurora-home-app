import { DataPoint, DataType, PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { eachMinuteOfInterval, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const currentDate = new Date();
  const dates = eachMinuteOfInterval({
    start: subDays(currentDate, 360),
    end: currentDate,
  });

  await Promise.all(
    dates.map(async (date) => {
      const data: Omit<DataPoint, "id">[] = [];

      data.push({
        createdAt: date,
        value: faker.number.float({ min: 0, max: 100 }).toString(),
        type: DataType.TEMPERATURE,
      });

      data.push({
        createdAt: date,
        value: faker.number.float({ min: 0, max: 100 }).toString(),
        type: DataType.HUMIDITY,
      });

      data.push({
        createdAt: date,
        value: faker.number.float({ min: 0, max: 100 }).toString(),
        type: DataType.LIGHT,
      });

      data.push({
        createdAt: date,
        value: faker.number.float({ min: 0, max: 100 }).toString(),
        type: DataType.MOTION,
      });

      await prisma.dataPoint.createMany({
        data,
      });
    })
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
