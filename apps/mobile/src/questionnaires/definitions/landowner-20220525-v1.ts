import { FieldType, QuestionDefinition, QuestionnaireDefinition, QuestionOption } from "../types";

type BuilderQuestion = QuestionDefinition & { withOptions: (options: QuestionOption[]) => BuilderQuestion; withRule: (questionCode: string, value: string, required?: boolean) => QuestionDefinition; withRepeat: (group: string) => QuestionDefinition };

const yesNo: QuestionOption[] = [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }];
const genderOptions: QuestionOption[] = [{ label: "Female", value: "FEMALE" }, { label: "Male", value: "MALE" }, { label: "Other / specify", value: "OTHER" }];
const respondentRelationship = ["Household Head", "Wife/Husband", "Mother/Father", "Daughter/Son", "Others"].map(toOption);
const ownershipTypes = ["Individual", "Community Ownership", "Corporation"].map(toOption);
const landUses = ["Residential", "Commercial", "Industrial", "Agricultural", "Others"].map(toOption);
const treePlanters = ["Landowner", "Household occupying the land", "Others/third party"].map(toOption);

export const landowner20220525V1: QuestionnaireDefinition = {
  deferredSections: ["drawn signatures/media", "tenant identity repeat records", "normalized tree/crop species inventory", "automatic Business module creation", "final taxonomy normalization"],
  id: "landowner-20220525-v1",
  moduleType: "LANDOWNER",
  repeatGroups: [
    feedbackGroup("landowner.feedback.issues", "Issues / Concerns"),
    feedbackGroup("landowner.feedback.recommendations", "Recommendations"),
    feedbackGroup("landowner.feedback.benefits", "Perceived Benefits"),
    feedbackGroup("landowner.feedback.livelihood_preferences", "Livelihood Preferences")
  ],
  sections: [
    { code: "landowner.interview", questions: [q("landowner.interview.enumerator_name", "Enumerator's name", "TEXT", "Part I - Interview Record", true), q("landowner.interview.survey_date", "Survey date", "DATE", "Part I - Interview Record", true), q("landowner.interview.time_started", "Time started", "TIME", "Part I - Interview Record"), q("landowner.interview.time_finished", "Time finished", "TIME", "Part I - Interview Record"), q("landowner.interview.barangay", "Barangay", "TEXT", "Part I - Interview Record")], title: "Interview Record" },
    { code: "landowner.respondent", questions: personQuestions("landowner.respondent", "Respondent", "Respondent Details", true).concat([select("landowner.respondent.relationship_to_landowner", "Respondent's relationship to the landowner", respondentRelationship, "Respondent Details", true), q("landowner.respondent.relationship_other", "Other respondent relationship", "TEXT", "Respondent Details").withRule("landowner.respondent.relationship_to_landowner", "OTHERS"), q("landowner.respondent.valid_id_type", "Respondent's type of valid ID presented", "TEXT", "Respondent Details")]), title: "Respondent Details" },
    { code: "landowner.owner", questions: personQuestions("landowner.owner", "Landowner", "Landowner Details", true).concat([q("landowner.owner.occupation", "Occupation", "TEXT", "Landowner Details", false, { target: "UNRESOLVED" }), q("landowner.owner.address_barangay", "Address: barangay", "TEXT", "Landowner Details")]), title: "Landowner Details" },
    { code: "landowner.spouse", questions: [q("landowner.spouse.last_name", "Spouse last name", "TEXT", "Landowner Details"), q("landowner.spouse.first_name", "Spouse first name", "TEXT", "Landowner Details"), q("landowner.spouse.middle_name", "Spouse middle name", "TEXT", "Landowner Details"), q("landowner.spouse.maiden_name", "Spouse maiden name", "TEXT", "Landowner Details")], title: "Landowner Spouse Details" },
    { code: "landowner.land", questions: [select("landowner.land.occupies_owned_land", "Do you occupy the land you own?", yesNo, "Affected Land Type and Ownership Details", true), select("landowner.land.ownership_type", "Type of ownership of the land occupied/owned", ownershipTypes, "Affected Land Type and Ownership Details", false, { entity: "LandParcel", field: "ownershipTypeRaw", target: "BOTH" }, { topic: "land", category: "ownership_type" }), q("landowner.land.area", "Area of land occupied/owned (ha or m2)", "DECIMAL", "Affected Land Type and Ownership Details", false, { entity: "LandParcel", field: "areaValue", target: "BOTH" }, { topic: "land", category: "area" }), select("landowner.land.actual_use", "Current actual use of land", landUses, "Affected Land Type and Ownership Details", false, { entity: "LandParcel", field: "landUseRaw", target: "BOTH" }, { topic: "land", category: "use" }), q("landowner.land.proof", "Proof of ownership", "TEXTAREA", "Affected Land Type and Ownership Details"), q("landowner.land.acquisition", "How did you acquire the land?", "TEXTAREA", "Affected Land Type and Ownership Details"), select("landowner.land.real_estate_tax_paid", "Do you pay real estate tax for the land?", yesNo, "Affected Land Type and Ownership Details"), select("landowner.land.mortgaged", "Is the land currently on loan or used as mortgage?", yesNo, "Affected Land Type and Ownership Details")], title: "Affected Land" },
    { code: "landowner.structure", questions: [select("landowner.structure.exists", "Is there a structure on your land?", yesNo, "Affected Land Type and Ownership Details", true), select("landowner.structure.occupied_by_households", "Is it occupied by households?", yesNo, "Affected Land Type and Ownership Details").withRule("landowner.structure.exists", "YES"), q("landowner.structure.use", "Use of the structure", "TEXT", "Affected Land Type and Ownership Details", false, { entity: "Structure", field: "structureUseRaw", target: "BOTH" }).withRule("landowner.structure.exists", "YES")], title: "Structures On Land" },
    { code: "landowner.business", questions: [withModuleTrigger(select("landowner.business.exists_on_land", "Is there a business on the land you own?", yesNo, "Affected Land Type and Ownership Details", true), "BUSINESS", "RECOMMENDED", "Business questionnaire is recommended because a business exists on the land.", "YES"), select("landowner.business.owned_by_landowner", "Do you own that business?", yesNo, "Affected Land Type and Ownership Details").withRule("landowner.business.exists_on_land", "YES"), q("landowner.business.kind", "What kind of business?", "TEXT", "Affected Land Type and Ownership Details", false, { entity: "Business", field: "natureOfBusinessRaw", target: "UNRESOLVED" }, { topic: "business", category: "nature" }).withRule("landowner.business.exists_on_land", "YES")], title: "Business Presence" },
    { code: "landowner.rental_tenancy", questions: [select("landowner.rent.land_rented_out", "Is the land being rented out?", yesNo, "Affected Land Type and Ownership Details"), q("landowner.rent.land_monthly_rental", "Monthly rental for land", "MONEY", "Affected Land Type and Ownership Details").withRule("landowner.rent.land_rented_out", "YES"), select("landowner.rent.structure_rented_out", "Is the structure being rented out?", yesNo, "Affected Land Type and Ownership Details").withRule("landowner.structure.exists", "YES"), q("landowner.rent.structure_monthly_rental", "Monthly rental for structure", "MONEY", "Affected Land Type and Ownership Details").withRule("landowner.rent.structure_rented_out", "YES"), select("landowner.tenants.exists", "Are there tenants on the land?", yesNo, "Affected Land Type and Ownership Details"), select("landowner.tenants.pay_for_use", "If yes, do they pay for the use of the land?", yesNo, "Affected Land Type and Ownership Details").withRule("landowner.tenants.exists", "YES")], title: "Rental / Tenancy Information" },
    { code: "landowner.trees_crops", questions: [select("landowner.trees_crops.exists", "Are there trees and crops on the land?", yesNo, "Affected Land Type and Ownership Details", true), select("landowner.trees_crops.planter", "Who planted the trees and crops?", treePlanters, "Affected Land Type and Ownership Details").withRule("landowner.trees_crops.exists", "YES"), q("landowner.trees_crops.additional_remarks", "Additional remarks", "TEXTAREA", "Affected Land Type and Ownership Details").withRule("landowner.trees_crops.exists", "YES"), select("landowner.trees_crops.paid_for_planting", "If you did not plant them, did you pay for planting?", yesNo, "Affected Land Type and Ownership Details").withRule("landowner.trees_crops.exists", "YES"), q("landowner.trees_crops.profit_sharing_arrangement", "Arrangement/sharing of proceeds/profit", "TEXTAREA", "Affected Land Type and Ownership Details").withRule("landowner.trees_crops.paid_for_planting", "YES")], title: "Trees And Crops" },
    { code: "landowner.project_awareness", questions: [select("landowner.project_awareness.aware", "Are you aware of the TLR/MRP: TDD project?", yesNo, "Project Awareness", true), q("landowner.project_awareness.source", "If yes, where did you learn about the project?", "TEXT", "Project Awareness").withRule("landowner.project_awareness.aware", "YES", true)], title: "Project Awareness" },
    repeatSection("landowner.feedback.issues_section", "Issues / Concerns", "landowner.feedback.issues"),
    repeatSection("landowner.feedback.recommendations_section", "Recommendations", "landowner.feedback.recommendations"),
    repeatSection("landowner.feedback.benefits_section", "Perceived Project Benefits", "landowner.feedback.benefits"),
    repeatSection("landowner.feedback.livelihood_preferences_section", "Livelihood Restoration Preferences", "landowner.feedback.livelihood_preferences"),
    { code: "landowner.certification", questions: [staticText("landowner.certification.respondent_text", "I hereby certify that all data entered hereto are true and correct to the best of my knowledge."), select("landowner.certification.respondent_acknowledged", "Interviewee/respondent certification acknowledged", yesNo, "Certification"), q("landowner.certification.respondent_date", "Interviewee/respondent certification date", "DATE", "Certification"), staticText("landowner.certification.interviewer_text", "I hereby certify that the data set forth were obtained/reviewed by me personally in accordance with the instructions given."), q("landowner.certification.interviewer_name", "Field interviewer name", "TEXT", "Certification"), q("landowner.certification.interviewer_date", "Field interviewer certification date", "DATE", "Certification"), q("landowner.certification.reviewer_name", "Reviewer/Supervisor name", "TEXT", "Certification"), q("landowner.certification.reviewer_date", "Reviewer/Supervisor date", "DATE", "Certification")], title: "Certification Metadata" }
  ],
  sourceQuestionnaire: "20220525-TLR-Census-for-Landowners.docx",
  sourceVersion: "20220525-v1",
  title: "Landowner Questionnaire",
  versionCode: "INITIAL"
};

function personQuestions(prefix: string, subject: string, sourceSection: string, required: boolean): QuestionDefinition[] {
  return [q(`${prefix}.last_name`, `${subject} last name`, "TEXT", sourceSection, required), q(`${prefix}.first_name`, `${subject} first name`, "TEXT", sourceSection, required), q(`${prefix}.middle_name`, `${subject} middle name`, "TEXT", sourceSection), q(`${prefix}.maiden_name`, `${subject} maiden name`, "TEXT", sourceSection), q(`${prefix}.birth_date`, `${subject} birth date`, "DATE", sourceSection), q(`${prefix}.age`, `${subject} age`, "INTEGER", sourceSection), select(`${prefix}.gender`, `${subject} gender`, genderOptions, sourceSection), q(`${prefix}.contact_number`, `${subject} contact number`, "TEXT", sourceSection), q(`${prefix}.email`, `${subject} email address`, "TEXT", sourceSection)];
}

function feedbackGroup(code: string, titleText: string) {
  return { code, linkedDomainEntity: "Response-only project feedback item.", minOccurrences: 0, orderMatters: true, questions: [q(`${code}.text`, titleText, "TEXTAREA", "Project Awareness", true).withRepeat(code)], title: titleText };
}

function q(code: string, label: string, type: FieldType, sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"]): BuilderQuestion {
  return addBuilders({ code, domainMapping: domainMapping ?? { target: "RESPONSE_ONLY" }, label, reportingMapping, required, sourceSection, sourceText: label, type });
}

function select(code: string, label: string, options: QuestionOption[], sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"]) {
  return q(code, label, "SINGLE_SELECT", sourceSection, required, domainMapping, reportingMapping).withOptions(options);
}

function staticText(code: string, label: string): QuestionDefinition {
  return { code, label, sourceSection: "Certification", sourceText: label, type: "STATIC_TEXT" };
}

function repeatSection(code: string, titleText: string, repeatGroupCode: string, description?: string) {
  return { code, description, questions: [], repeatGroupCode, title: titleText };
}

function addBuilders(question: QuestionDefinition): BuilderQuestion {
  return Object.assign(question, {
    withOptions(options: QuestionOption[]) {
      return addBuilders({ ...question, optionSource: { type: "INLINE_OPTIONS" }, options });
    },
    withRepeat(group: string) {
      return { ...question, repeatGroup: group };
    },
    withRule(questionCode: string, value: string, required = false) {
      return { ...question, rules: [{ effect: "SHOW_IF" as const, operator: "EQUALS" as const, questionCode, value }, ...(required ? [{ effect: "REQUIRE_IF" as const, operator: "EQUALS" as const, questionCode, value }] : [])] };
    }
  });
}

function withModuleTrigger(question: QuestionDefinition, moduleType: "BUSINESS" | "HOUSEHOLD" | "LANDOWNER", outcome: "REQUIRED" | "RECOMMENDED" | "OPTIONAL" | "NOT_APPLICABLE", message: string, value: string): QuestionDefinition {
  return { ...question, moduleTriggers: [{ message, moduleType, outcome, value }] };
}

function toOption(label: string): QuestionOption {
  return { label, value: label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") };
}
