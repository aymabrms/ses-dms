-- CreateEnum
CREATE TYPE "ResponseState" AS ENUM ('ANSWERED', 'NO_RESPONSE', 'NOT_APPLICABLE', 'UNKNOWN', 'MISSING', 'REQUIRES_VALIDATION');

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('INFORMATION', 'WARNING', 'ERROR', 'BLOCKING_ERROR');

-- CreateEnum
CREATE TYPE "ValidationIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "interview_modules" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "questionnaire_repeat_instances" (
    "id" UUID NOT NULL,
    "interviewModuleId" UUID NOT NULL,
    "groupCode" TEXT NOT NULL,
    "parentRepeatInstanceId" UUID,
    "sequenceNumber" INTEGER,
    "linkedPersonId" UUID,
    "linkedHouseholdMembershipId" UUID,
    "linkedBusinessEmployeeId" UUID,
    "linkedStructureId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_repeat_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_responses" (
    "id" UUID NOT NULL,
    "interviewModuleId" UUID NOT NULL,
    "questionCode" TEXT NOT NULL,
    "repeatInstanceId" UUID,
    "responseState" "ResponseState" NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,4),
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" JSONB,
    "rawValue" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_issues" (
    "id" UUID NOT NULL,
    "interviewId" UUID,
    "interviewModuleId" UUID,
    "questionnaireResponseId" UUID,
    "severity" "ValidationSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ValidationIssueStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,

    CONSTRAINT "validation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_interviewModuleId_idx" ON "questionnaire_repeat_instances"("interviewModuleId");

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_parentRepeatInstanceId_idx" ON "questionnaire_repeat_instances"("parentRepeatInstanceId");

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_linkedPersonId_idx" ON "questionnaire_repeat_instances"("linkedPersonId");

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_linkedHouseholdMembershipId_idx" ON "questionnaire_repeat_instances"("linkedHouseholdMembershipId");

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_linkedBusinessEmployeeId_idx" ON "questionnaire_repeat_instances"("linkedBusinessEmployeeId");

-- CreateIndex
CREATE INDEX "questionnaire_repeat_instances_linkedStructureId_idx" ON "questionnaire_repeat_instances"("linkedStructureId");

-- CreateIndex
CREATE INDEX "questionnaire_responses_interviewModuleId_idx" ON "questionnaire_responses"("interviewModuleId");

-- CreateIndex
CREATE INDEX "questionnaire_responses_repeatInstanceId_idx" ON "questionnaire_responses"("repeatInstanceId");

-- CreateIndex
CREATE INDEX "questionnaire_responses_questionCode_idx" ON "questionnaire_responses"("questionCode");

-- CreateIndex
CREATE INDEX "validation_issues_interviewId_idx" ON "validation_issues"("interviewId");

-- CreateIndex
CREATE INDEX "validation_issues_interviewModuleId_idx" ON "validation_issues"("interviewModuleId");

-- CreateIndex
CREATE INDEX "validation_issues_questionnaireResponseId_idx" ON "validation_issues"("questionnaireResponseId");

-- CreateIndex
CREATE INDEX "validation_issues_resolvedByUserId_idx" ON "validation_issues"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "validation_issues_status_idx" ON "validation_issues"("status");

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_interviewModuleId_fkey" FOREIGN KEY ("interviewModuleId") REFERENCES "interview_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_parentRepeatInstanceId_fkey" FOREIGN KEY ("parentRepeatInstanceId") REFERENCES "questionnaire_repeat_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_linkedPersonId_fkey" FOREIGN KEY ("linkedPersonId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_linkedHouseholdMembershipId_fkey" FOREIGN KEY ("linkedHouseholdMembershipId") REFERENCES "household_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_linkedBusinessEmployeeId_fkey" FOREIGN KEY ("linkedBusinessEmployeeId") REFERENCES "business_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_repeat_instances" ADD CONSTRAINT "questionnaire_repeat_instances_linkedStructureId_fkey" FOREIGN KEY ("linkedStructureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_interviewModuleId_fkey" FOREIGN KEY ("interviewModuleId") REFERENCES "interview_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_repeatInstanceId_fkey" FOREIGN KEY ("repeatInstanceId") REFERENCES "questionnaire_repeat_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_interviewModuleId_fkey" FOREIGN KEY ("interviewModuleId") REFERENCES "interview_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_questionnaireResponseId_fkey" FOREIGN KEY ("questionnaireResponseId") REFERENCES "questionnaire_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
