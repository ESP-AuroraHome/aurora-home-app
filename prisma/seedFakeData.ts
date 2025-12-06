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

  const batchSize = 1000;
  const allData: Omit<DataPoint, "id">[] = [];

  for (const date of dates) {
    allData.push({
      createdAt: date,
      value: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toFixed(2),
      type: DataType.TEMPERATURE,
    });

    allData.push({
      createdAt: date,
      value: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toFixed(2),
      type: DataType.HUMIDITY,
    });

    allData.push({
      createdAt: date,
      value: faker.number.float({ min: 980, max: 1050, fractionDigits: 2 }).toFixed(2),
      type: DataType.PRESSURE,
    });

    allData.push({
      createdAt: date,
      value: faker.number.float({ min: 400, max: 1000, fractionDigits: 2 }).toFixed(2),
      type: DataType.CO2,
    });

    allData.push({
      createdAt: date,
      value: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }).toFixed(2),
      type: DataType.LIGHT,
    });
  }

  for (let i = 0; i < allData.length; i += batchSize) {
    const batch = allData.slice(i, i + batchSize);
    await prisma.dataPoint.createMany({
      data: batch,
    });
    console.log(`Inserted ${Math.min(i + batchSize, allData.length)} / ${allData.length} records`);
  }
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
