import { PrismaClient, QuestionnaireModuleType } from "@prisma/client";

const prisma = new PrismaClient();

const lookupSets = [
  { code: "HOUSEHOLD_RELATIONSHIP", name: "Household relationship" },
  { code: "EMPLOYMENT_STATUS", name: "Employment status" },
  { code: "CIVIL_STATUS", name: "Civil status" },
  { code: "EDUCATION", name: "Educational attainment" },
  { code: "STRUCTURE_TYPE", name: "Structure type" },
  { code: "LAND_USE", name: "Land use" }
];

const questionnaireVersions = [
  {
    moduleType: QuestionnaireModuleType.HOUSEHOLD,
    versionCode: "INITIAL",
    title: "Household Questionnaire"
  },
  {
    moduleType: QuestionnaireModuleType.BUSINESS,
    versionCode: "INITIAL",
    title: "Business Questionnaire"
  },
  {
    moduleType: QuestionnaireModuleType.LANDOWNER,
    versionCode: "INITIAL",
    title: "Landowner Questionnaire"
  }
];

async function main() {
  for (const lookupSet of lookupSets) {
    await prisma.lookupSet.upsert({
      where: { code: lookupSet.code },
      update: { name: lookupSet.name },
      create: lookupSet
    });
  }

  for (const questionnaireVersion of questionnaireVersions) {
    const existing = await prisma.questionnaireVersion.findFirst({
      where: {
        projectId: null,
        moduleType: questionnaireVersion.moduleType,
        versionCode: questionnaireVersion.versionCode
      }
    });

    if (existing) {
      await prisma.questionnaireVersion.update({
        where: { id: existing.id },
        data: {
          title: questionnaireVersion.title,
          isActive: true
        }
      });
      continue;
    }

    await prisma.questionnaireVersion.create({ data: questionnaireVersion });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
