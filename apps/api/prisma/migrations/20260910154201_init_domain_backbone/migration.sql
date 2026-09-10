-- CreateEnum
CREATE TYPE "QuestionnaireModuleType" AS ENUM ('HOUSEHOLD', 'BUSINESS', 'LANDOWNER');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('DRAFT', 'READY_TO_SYNC', 'SYNCED', 'FOR_VALIDATION', 'RETURNED_FOR_CORRECTION', 'VALIDATED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'FOR_VALIDATION', 'RETURNED_FOR_CORRECTION', 'VALIDATED', 'FINALIZED');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_areas" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_versions" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "moduleType" "QuestionnaireModuleType" NOT NULL,
    "versionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID NOT NULL,
    "respondentPersonId" UUID,
    "enumeratorUserId" UUID NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" "InterviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_modules" (
    "id" UUID NOT NULL,
    "interviewId" UUID NOT NULL,
    "questionnaireVersionId" UUID NOT NULL,
    "moduleType" "QuestionnaireModuleType" NOT NULL,
    "householdId" UUID,
    "businessId" UUID,
    "landParcelId" UUID,
    "structureId" UUID,
    "status" "ModuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" UUID NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "maidenName" TEXT,
    "birthDate" TIMESTAMP(3),
    "genderRaw" TEXT,
    "primaryContactNumber" TEXT,
    "primaryEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_identity_observations" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "interviewModuleId" UUID,
    "firstNameRaw" TEXT,
    "middleNameRaw" TEXT,
    "lastNameRaw" TEXT,
    "maidenNameRaw" TEXT,
    "birthDateCaptured" TIMESTAMP(3),
    "birthDateRaw" TEXT,
    "ageCaptured" INTEGER,
    "genderRaw" TEXT,
    "contactNumberRaw" TEXT,
    "emailRaw" TEXT,
    "validIdTypeRaw" TEXT,
    "sourceRoleRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_identity_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_memberships" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "relationshipToHeadRaw" TEXT,
    "relationshipLookupValueId" UUID,
    "memberOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID NOT NULL,
    "name" TEXT,
    "natureOfBusinessRaw" TEXT,
    "ownershipTypeRaw" TEXT,
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organizationTypeRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_ownerships" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "personId" UUID,
    "organizationId" UUID,
    "ownershipTypeRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_employees" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "employmentStatusRaw" TEXT,
    "workAssignmentRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_parcels" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID NOT NULL,
    "areaValue" DECIMAL(12,2),
    "areaUnit" TEXT,
    "landUseRaw" TEXT,
    "ownershipTypeRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_ownerships" (
    "id" UUID NOT NULL,
    "landParcelId" UUID NOT NULL,
    "personId" UUID,
    "organizationId" UUID,
    "ownershipTypeRaw" TEXT,
    "proofOfOwnershipRaw" TEXT,
    "acquisitionMethodRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structures" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID NOT NULL,
    "landParcelId" UUID,
    "structureUseRaw" TEXT,
    "structureTypeRaw" TEXT,
    "structureConditionRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure_tags" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "surveyAreaId" UUID,
    "tagValue" TEXT NOT NULL,
    "tagTypeRaw" TEXT,
    "sourceRaw" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "structure_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure_associations" (
    "id" UUID NOT NULL,
    "parentStructureId" UUID NOT NULL,
    "childStructureId" UUID NOT NULL,
    "associationTypeRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "structure_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure_occupancies" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "householdId" UUID,
    "businessId" UUID,
    "personId" UUID,
    "occupancyTypeRaw" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "structure_occupancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_sets" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookup_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_values" (
    "id" UUID NOT NULL,
    "lookupSetId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookup_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "survey_areas_projectId_idx" ON "survey_areas"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "questionnaire_versions_projectId_idx" ON "questionnaire_versions"("projectId");

-- CreateIndex
CREATE INDEX "questionnaire_versions_moduleType_idx" ON "questionnaire_versions"("moduleType");

-- CreateIndex
CREATE INDEX "interviews_projectId_idx" ON "interviews"("projectId");

-- CreateIndex
CREATE INDEX "interviews_surveyAreaId_idx" ON "interviews"("surveyAreaId");

-- CreateIndex
CREATE INDEX "interviews_respondentPersonId_idx" ON "interviews"("respondentPersonId");

-- CreateIndex
CREATE INDEX "interviews_enumeratorUserId_idx" ON "interviews"("enumeratorUserId");

-- CreateIndex
CREATE INDEX "interview_modules_interviewId_idx" ON "interview_modules"("interviewId");

-- CreateIndex
CREATE INDEX "interview_modules_questionnaireVersionId_idx" ON "interview_modules"("questionnaireVersionId");

-- CreateIndex
CREATE INDEX "interview_modules_householdId_idx" ON "interview_modules"("householdId");

-- CreateIndex
CREATE INDEX "interview_modules_businessId_idx" ON "interview_modules"("businessId");

-- CreateIndex
CREATE INDEX "interview_modules_landParcelId_idx" ON "interview_modules"("landParcelId");

-- CreateIndex
CREATE INDEX "interview_modules_structureId_idx" ON "interview_modules"("structureId");

-- CreateIndex
CREATE INDEX "persons_lastName_idx" ON "persons"("lastName");

-- CreateIndex
CREATE INDEX "person_identity_observations_personId_idx" ON "person_identity_observations"("personId");

-- CreateIndex
CREATE INDEX "person_identity_observations_interviewModuleId_idx" ON "person_identity_observations"("interviewModuleId");

-- CreateIndex
CREATE INDEX "households_projectId_idx" ON "households"("projectId");

-- CreateIndex
CREATE INDEX "households_surveyAreaId_idx" ON "households"("surveyAreaId");

-- CreateIndex
CREATE INDEX "household_memberships_householdId_idx" ON "household_memberships"("householdId");

-- CreateIndex
CREATE INDEX "household_memberships_personId_idx" ON "household_memberships"("personId");

-- CreateIndex
CREATE INDEX "household_memberships_relationshipLookupValueId_idx" ON "household_memberships"("relationshipLookupValueId");

-- CreateIndex
CREATE INDEX "businesses_projectId_idx" ON "businesses"("projectId");

-- CreateIndex
CREATE INDEX "businesses_surveyAreaId_idx" ON "businesses"("surveyAreaId");

-- CreateIndex
CREATE INDEX "business_ownerships_businessId_idx" ON "business_ownerships"("businessId");

-- CreateIndex
CREATE INDEX "business_ownerships_personId_idx" ON "business_ownerships"("personId");

-- CreateIndex
CREATE INDEX "business_ownerships_organizationId_idx" ON "business_ownerships"("organizationId");

-- CreateIndex
CREATE INDEX "business_employees_businessId_idx" ON "business_employees"("businessId");

-- CreateIndex
CREATE INDEX "business_employees_personId_idx" ON "business_employees"("personId");

-- CreateIndex
CREATE INDEX "land_parcels_projectId_idx" ON "land_parcels"("projectId");

-- CreateIndex
CREATE INDEX "land_parcels_surveyAreaId_idx" ON "land_parcels"("surveyAreaId");

-- CreateIndex
CREATE INDEX "land_ownerships_landParcelId_idx" ON "land_ownerships"("landParcelId");

-- CreateIndex
CREATE INDEX "land_ownerships_personId_idx" ON "land_ownerships"("personId");

-- CreateIndex
CREATE INDEX "land_ownerships_organizationId_idx" ON "land_ownerships"("organizationId");

-- CreateIndex
CREATE INDEX "structures_projectId_idx" ON "structures"("projectId");

-- CreateIndex
CREATE INDEX "structures_surveyAreaId_idx" ON "structures"("surveyAreaId");

-- CreateIndex
CREATE INDEX "structures_landParcelId_idx" ON "structures"("landParcelId");

-- CreateIndex
CREATE INDEX "structure_tags_structureId_idx" ON "structure_tags"("structureId");

-- CreateIndex
CREATE INDEX "structure_tags_projectId_idx" ON "structure_tags"("projectId");

-- CreateIndex
CREATE INDEX "structure_tags_surveyAreaId_idx" ON "structure_tags"("surveyAreaId");

-- CreateIndex
CREATE INDEX "structure_tags_tagValue_idx" ON "structure_tags"("tagValue");

-- CreateIndex
CREATE INDEX "structure_associations_parentStructureId_idx" ON "structure_associations"("parentStructureId");

-- CreateIndex
CREATE INDEX "structure_associations_childStructureId_idx" ON "structure_associations"("childStructureId");

-- CreateIndex
CREATE INDEX "structure_occupancies_structureId_idx" ON "structure_occupancies"("structureId");

-- CreateIndex
CREATE INDEX "structure_occupancies_householdId_idx" ON "structure_occupancies"("householdId");

-- CreateIndex
CREATE INDEX "structure_occupancies_businessId_idx" ON "structure_occupancies"("businessId");

-- CreateIndex
CREATE INDEX "structure_occupancies_personId_idx" ON "structure_occupancies"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_sets_code_key" ON "lookup_sets"("code");

-- CreateIndex
CREATE INDEX "lookup_values_lookupSetId_idx" ON "lookup_values"("lookupSetId");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_values_lookupSetId_code_key" ON "lookup_values"("lookupSetId", "code");

-- AddForeignKey
ALTER TABLE "survey_areas" ADD CONSTRAINT "survey_areas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_versions" ADD CONSTRAINT "questionnaire_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_respondentPersonId_fkey" FOREIGN KEY ("respondentPersonId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_enumeratorUserId_fkey" FOREIGN KEY ("enumeratorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_questionnaireVersionId_fkey" FOREIGN KEY ("questionnaireVersionId") REFERENCES "questionnaire_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "land_parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_modules" ADD CONSTRAINT "interview_modules_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_identity_observations" ADD CONSTRAINT "person_identity_observations_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_identity_observations" ADD CONSTRAINT "person_identity_observations_interviewModuleId_fkey" FOREIGN KEY ("interviewModuleId") REFERENCES "interview_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_memberships" ADD CONSTRAINT "household_memberships_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_memberships" ADD CONSTRAINT "household_memberships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_memberships" ADD CONSTRAINT "household_memberships_relationshipLookupValueId_fkey" FOREIGN KEY ("relationshipLookupValueId") REFERENCES "lookup_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownerships" ADD CONSTRAINT "business_ownerships_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownerships" ADD CONSTRAINT "business_ownerships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ownerships" ADD CONSTRAINT "business_ownerships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_employees" ADD CONSTRAINT "business_employees_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_employees" ADD CONSTRAINT "business_employees_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_parcels" ADD CONSTRAINT "land_parcels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_parcels" ADD CONSTRAINT "land_parcels_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_ownerships" ADD CONSTRAINT "land_ownerships_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "land_parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_ownerships" ADD CONSTRAINT "land_ownerships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_ownerships" ADD CONSTRAINT "land_ownerships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "land_parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_tags" ADD CONSTRAINT "structure_tags_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_tags" ADD CONSTRAINT "structure_tags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_tags" ADD CONSTRAINT "structure_tags_surveyAreaId_fkey" FOREIGN KEY ("surveyAreaId") REFERENCES "survey_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_associations" ADD CONSTRAINT "structure_associations_parentStructureId_fkey" FOREIGN KEY ("parentStructureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_associations" ADD CONSTRAINT "structure_associations_childStructureId_fkey" FOREIGN KEY ("childStructureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_occupancies" ADD CONSTRAINT "structure_occupancies_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_occupancies" ADD CONSTRAINT "structure_occupancies_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_occupancies" ADD CONSTRAINT "structure_occupancies_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_occupancies" ADD CONSTRAINT "structure_occupancies_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_values" ADD CONSTRAINT "lookup_values_lookupSetId_fkey" FOREIGN KEY ("lookupSetId") REFERENCES "lookup_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "business_ownerships" ADD CONSTRAINT "business_ownerships_exactly_one_owner_check" CHECK (("personId" IS NOT NULL)::int + ("organizationId" IS NOT NULL)::int = 1);

-- AddCheckConstraint
ALTER TABLE "land_ownerships" ADD CONSTRAINT "land_ownerships_exactly_one_owner_check" CHECK (("personId" IS NOT NULL)::int + ("organizationId" IS NOT NULL)::int = 1);

-- AddCheckConstraint
ALTER TABLE "structure_occupancies" ADD CONSTRAINT "structure_occupancies_exactly_one_occupant_check" CHECK (("householdId" IS NOT NULL)::int + ("businessId" IS NOT NULL)::int + ("personId" IS NOT NULL)::int = 1);

-- AddCheckConstraint
ALTER TABLE "structure_associations" ADD CONSTRAINT "structure_associations_not_self_check" CHECK ("parentStructureId" <> "childStructureId");
