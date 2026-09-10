import { FieldType, QuestionDefinition, QuestionnaireDefinition, QuestionOption } from "../types";

type BuilderQuestion = QuestionDefinition & { withOptions: (options: QuestionOption[]) => BuilderQuestion; withRule: (questionCode: string, value: string, required?: boolean) => QuestionDefinition; withRepeat: (group: string) => QuestionDefinition };

const yesNo: QuestionOption[] = [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }];
const genderOptions: QuestionOption[] = [{ label: "Female", value: "FEMALE" }, { label: "Male", value: "MALE" }, { label: "Other / specify", value: "OTHER" }];
const ownershipTypes = ["Single Proprietorship", "Partnership", "Corporation", "Others"].map(toOption);
const employmentStatus = ["Permanent", "Temporary", "Others"].map(toOption);
const salaryFrequency = ["Daily", "Weekly", "Monthly"].map(toOption);
const financialInstitutions = ["Pag-IBIG", "GSIS", "SSS", "Cooperative", "PhilHealth", "Micro-finance", "Others"].map(toOption);
const structureTypes = ["Commercial", "Commercial-residential", "Industrial", "Institutional", "Residential-institutional", "Other"].map(toOption);
const occupancyArrangement = ["Tenant/renter", "Rent-free", "Others"].map(toOption);
const tradeSkills = ["Carpentry", "Plumbing", "Welding", "Beauty Care", "Cooking", "Sewing", "Driving", "Basic Computer Operation", "Mechanic", "Industrial Painting", "Computer Technician", "Hair Dressing", "Food Processing", "Handicrafts Making", "Others"].map(toOption);
const livelihoodAssistance = ["Job/employment within the current sector", "Replacement land/business structure", "Any job/employment", "Vocational/Skills Training", "Financial assistance in finding new employment", "Others"].map(toOption);
const trainingSectors = ["Construction related", "Food Preparation/Technology", "Hotel/Restaurant related", "Automotive related", "Electronic/Electrical related", "Computer related", "Health related", "Clerical related", "Sales related", "Personal Services related", "Design/Arts related", "Dressmaking related", "Agriculture related", "Aquaculture Related", "Business/Finance related"].map(toOption);
const employmentLocations = ["Current barangay", "Any barangay within current city", "Any city within same province", "Near relocation site", "Other province", "Abroad/Outside the country"].map(toOption);

const employeeQuestions: QuestionDefinition[] = [
  q("business.employees.name", "Name of worker", "TEXT", "Part II - Employees' Profile", true, { target: "UNRESOLVED" }, { topic: "business_employees", category: "name" }),
  q("business.employees.first_name", "Worker first name, if split during encoding", "TEXT", "Part II - Employees' Profile", false, { entity: "Person", field: "firstName", target: "UNRESOLVED" }),
  q("business.employees.last_name", "Worker last name, if split during encoding", "TEXT", "Part II - Employees' Profile", false, { entity: "Person", field: "lastName", target: "UNRESOLVED" }),
  select("business.employees.gender", "Gender", genderOptions, "Part II - Employees' Profile", false, { entity: "Person", field: "genderRaw", target: "BOTH" }, { topic: "business_employees", category: "sex" }),
  q("business.employees.civil_status", "Civil status", "TEXT", "Part II - Employees' Profile", false, { target: "UNRESOLVED" }, { topic: "business_employees", category: "civil_status" }),
  select("business.employees.employment_status", "Employment status", employmentStatus, "Part II - Employees' Profile", false, { entity: "BusinessEmployee", field: "employmentStatusRaw", target: "BOTH" }, { topic: "business_employees", category: "employment_status" }),
  q("business.employees.age", "Age", "INTEGER", "Part II - Employees' Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_employees", category: "age" }),
  q("business.employees.work_assignment", "Work assignment", "TEXT", "Part II - Employees' Profile", false, { entity: "BusinessEmployee", field: "workAssignmentRaw", target: "BOTH" }, { topic: "business_employees", category: "work_assignment" }),
  q("business.employees.salary_amount", "Salary amount", "MONEY", "Part II - Employees' Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_employees", category: "salary_amount" }),
  select("business.employees.salary_frequency", "Salary frequency", salaryFrequency, "Part II - Employees' Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_employees", category: "salary_frequency" }),
  q("business.employees.educational_attainment", "Educational attainment", "TEXT", "Part II - Employees' Profile", false, { target: "UNRESOLVED" }, { topic: "business_employees", category: "education" }),
  q("business.employees.residence", "Worker's residence", "TEXT", "Part II - Employees' Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_employees", category: "residence" }),
  select("business.employees.stays_in_sleeping_quarters", "Stays in sleeping quarters within business premises?", yesNo, "Part II - Employees' Profile"),
  multi("business.employees.financial_institution_membership", "Financial institution membership", financialInstitutions, "Part II - Employees' Profile")
].map(withRepeat("business.employees"));

export const business20220525V1: QuestionnaireDefinition = {
  deferredSections: ["drawn signatures/media", "automatic Person creation from employee rows", "final taxonomy normalization", "salary frequency conversion", "employee total derivation", "cross-module auto-creation"],
  id: "business-20220525-v1",
  moduleType: "BUSINESS",
  repeatGroups: [
    { code: "business.employees", linkedDomainEntity: "Future BusinessEmployee + Person linkage; Phase 6D stores repeat responses immediately.", minOccurrences: 0, orderMatters: true, questions: employeeQuestions, title: "Employees" },
    feedbackGroup("business.feedback.issues", "Issues / Concerns"),
    feedbackGroup("business.feedback.recommendations", "Recommendations"),
    feedbackGroup("business.feedback.benefits", "Perceived Benefits"),
    feedbackGroup("business.feedback.livelihood_preferences", "Livelihood Preferences")
  ],
  sections: [
    { code: "business.interview", questions: [q("business.interview.enumerator_name", "Enumerator's name", "TEXT", "Part I - Interview Record", true), q("business.interview.survey_date", "Survey date", "DATE", "Part I - Interview Record", true), q("business.interview.time_started", "Time started", "TIME", "Part I - Interview Record"), q("business.interview.time_finished", "Time finished", "TIME", "Part I - Interview Record"), q("business.interview.barangay", "Barangay", "TEXT", "Part I - Interview Record"), q("business.structure.tag", "Structure tag number", "TEXT", "Part I - Tag Structure Details")], title: "Interview Record" },
    { code: "business.respondent", questions: personQuestions("business.respondent", "Respondent", "Respondent Details", true).concat([q("business.respondent.relationship_to_owner", "Respondent's relationship to the business owner", "TEXT", "Respondent Details", true), q("business.respondent.valid_id_type", "Respondent's type of valid ID presented", "TEXT", "Respondent Details")]), title: "Respondent Details" },
    { code: "business.owner", questions: personQuestions("business.owner", "Business owner", "Business Owner Details", true).concat([q("business.owner.civil_status", "Civil status", "TEXT", "Business Owner Details", false, { target: "UNRESOLVED" })]), title: "Business Owner Details" },
    { code: "business.profile", questions: [q("business.profile.name", "Name of business affected by the project", "TEXT", "Part II - Business Profile", true, { entity: "Business", field: "name", target: "BOTH" }, { topic: "business_profile", category: "name" }), q("business.profile.nature", "Nature of business", "TEXT", "Part II - Business Profile", false, { entity: "Business", field: "natureOfBusinessRaw", target: "BOTH" }, { topic: "business_profile", category: "nature" }), select("business.profile.ownership_type", "Type of business ownership", ownershipTypes, "Part II - Business Profile", false, { entity: "Business", field: "ownershipTypeRaw", target: "BOTH" }, { topic: "business_profile", category: "ownership_type" }), select("business.profile.has_permits", "Do you have business permits and licenses?", yesNo, "Part II - Business Profile"), q("business.profile.started_at", "When did the affected business start?", "DATE", "Part II - Business Profile", false, { entity: "Business", field: "startedAt", target: "BOTH" }), q("business.profile.operation_length", "Total length of business operation", "TEXT", "Part II - Business Profile"), q("business.profile.average_monthly_income", "Average monthly business income", "MONEY", "Part II - Business Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_finance", category: "income" }), q("business.profile.average_monthly_expenditure", "Average monthly business expenditure", "MONEY", "Part II - Business Profile", false, { target: "RESPONSE_ONLY" }, { topic: "business_finance", category: "expenditure" })], title: "Business Profile" },
    repeatSection("business.employees_section", "Employee Profile", "business.employees", "Add one repeat instance per worker. The printed 11 rows are not treated as a maximum."),
    { code: "business.employee_totals", questions: [q("business.employees.total_male", "Total number of employees: male", "INTEGER", "Part II - Employees' Profile"), q("business.employees.total_female", "Total number of employees: female", "INTEGER", "Part II - Employees' Profile"), select("business.employees.quarters_rented", "Are employees' quarters rented?", yesNo, "Part II - Employees' Profile"), q("business.employees.quarters_monthly_rate_per_employee", "If rented, monthly rate per employee", "MONEY", "Part II - Employees' Profile").withRule("business.employees.quarters_rented", "YES", true)], title: "Employee Totals And Quarters" },
    { code: "business.employee_skills", questions: [multi("business.employee_skills.current", "Current skills/expertise of employees", tradeSkills, "Part II - Employee Skills"), multi("business.employee_skills.preferred", "Preferred skills/expertise of employees", tradeSkills, "Part II - Employee Skills")], title: "Employee Skills" },
    { code: "business.structure_occupancy", questions: [select("business.structure.type", "Type of structure occupied", structureTypes, "Part III - Land and Structure Ownership and Usage"), select("business.structure.owns_structure", "Do you own the structure where the business is located?", yesNo, "Part III - Land and Structure Ownership and Usage", true), select("business.structure.occupancy_arrangement", "If no, what is the occupancy arrangement?", occupancyArrangement, "Part III - Land and Structure Ownership and Usage").withRule("business.structure.owns_structure", "NO", true), q("business.structure.monthly_rent", "Tenant/renter monthly rate", "MONEY", "Part III - Land and Structure Ownership and Usage").withRule("business.structure.occupancy_arrangement", "TENANT_RENTER", true), q("business.structure.occupancy_other", "Other occupancy arrangement", "TEXT", "Part III - Land and Structure Ownership and Usage").withRule("business.structure.occupancy_arrangement", "OTHERS")], title: "Structure / Occupancy" },
    { code: "business.land", questions: [select("business.land.owns_land", "Do you own the land where the business is located?", yesNo, "Part III - Land and Structure Ownership and Usage", true), q("business.land.proof", "If yes, proof of ownership", "TEXTAREA", "Part III - Land and Structure Ownership and Usage").withRule("business.land.owns_land", "YES", true), select("business.land.landowner_consent", "If no, do you have consent from the landowner?", yesNo, "Part III - Land and Structure Ownership and Usage").withRule("business.land.owns_land", "NO", true), select("business.land.pays_rental_fee", "If consented, do you pay a rental fee for land use?", yesNo, "Part III - Land and Structure Ownership and Usage").withRule("business.land.landowner_consent", "YES"), q("business.land.rental_amount", "Land rental amount", "MONEY", "Part III - Land and Structure Ownership and Usage").withRule("business.land.pays_rental_fee", "YES", true)], title: "Land / Ownership" },
    livelihoodSection("business.owner_livelihood", "Livelihood Rehabilitation For Business Owner", "Part IV - Livelihood Rehabilitation Measures for Business Owners"),
    livelihoodSection("business.employee_livelihood", "Livelihood Rehabilitation For Employees", "Part V - Livelihood Rehabilitation Measures for Employees"),
    { code: "business.project_awareness", questions: [select("business.project_awareness.aware", "Are you aware of the TLR/MRP: TDD project?", yesNo, "Part VI - Project Awareness", true), q("business.project_awareness.source", "If yes, where did you learn about the project?", "TEXT", "Part VI - Project Awareness").withRule("business.project_awareness.aware", "YES", true)], title: "Project Awareness" },
    repeatSection("business.feedback.issues_section", "Issues / Concerns", "business.feedback.issues"),
    repeatSection("business.feedback.recommendations_section", "Recommendations", "business.feedback.recommendations"),
    repeatSection("business.feedback.benefits_section", "Perceived Project Benefits", "business.feedback.benefits"),
    repeatSection("business.feedback.livelihood_preferences_section", "Livelihood Restoration Preferences", "business.feedback.livelihood_preferences"),
    { code: "business.certification", questions: [staticText("business.certification.interviewee_text", "I hereby certify that all data entered hereto are true and correct to the best of my knowledge."), select("business.certification.interviewee_acknowledged", "Interviewee certification acknowledged", yesNo, "Certification"), q("business.certification.interviewee_date", "Interviewee certification date", "DATE", "Certification"), staticText("business.certification.interviewer_text", "I hereby certify that the data set forth were obtained/reviewed by me personally in accordance with the instructions given."), q("business.certification.interviewer_name", "Field interviewer name", "TEXT", "Certification"), q("business.certification.interviewer_date", "Field interviewer certification date", "DATE", "Certification"), q("business.certification.reviewer_name", "Reviewer/Supervisor name", "TEXT", "Certification"), q("business.certification.reviewer_date", "Reviewer/Supervisor date", "DATE", "Certification")], title: "Certification Metadata" }
  ],
  sourceQuestionnaire: "20220525-TLR-Census-and-DMS-Survey_Business.pdf",
  sourceVersion: "20220525-v1",
  title: "Business Questionnaire",
  versionCode: "INITIAL"
};

function personQuestions(prefix: string, subject: string, sourceSection: string, required: boolean) {
  return [q(`${prefix}.last_name`, `${subject} last name`, "TEXT", sourceSection, required), q(`${prefix}.first_name`, `${subject} first name`, "TEXT", sourceSection, required), q(`${prefix}.middle_name`, `${subject} middle name`, "TEXT", sourceSection), q(`${prefix}.maiden_name`, `${subject} maiden name`, "TEXT", sourceSection), q(`${prefix}.birth_date`, `${subject} birth date`, "DATE", sourceSection), q(`${prefix}.age`, `${subject} age`, "INTEGER", sourceSection), select(`${prefix}.gender`, `${subject} gender`, genderOptions, sourceSection), q(`${prefix}.contact_number`, `${subject} contact number`, "TEXT", sourceSection), q(`${prefix}.email`, `${subject} email address`, "TEXT", sourceSection)];
}

function livelihoodSection(code: string, titleText: string, sourceSection: string) {
  return { code, questions: [multi(`${code}.assistance_needed`, "Livelihood assistance needed", livelihoodAssistance, sourceSection), multi(`${code}.current_skills`, "Current skills/expertise", trainingSectors, sourceSection), multi(`${code}.preferred_location`, "Preferred location for employment or new business", employmentLocations, sourceSection), multi(`${code}.preferred_training`, "Preferred vocational/skills training", trainingSectors, sourceSection)], title: titleText };
}

function feedbackGroup(code: string, titleText: string) {
  return { code, linkedDomainEntity: "Response-only project feedback item.", minOccurrences: 0, orderMatters: true, questions: [q(`${code}.text`, titleText, "TEXTAREA", "Part VI - Project Awareness", true).withRepeat(code)], title: titleText };
}

function q(code: string, label: string, type: FieldType, sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"]): BuilderQuestion {
  return addBuilders({ code, domainMapping: domainMapping ?? { target: "RESPONSE_ONLY" }, label, reportingMapping, required, sourceSection, sourceText: label, type });
}

function select(code: string, label: string, options: QuestionOption[], sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"]) {
  return q(code, label, "SINGLE_SELECT", sourceSection, required, domainMapping, reportingMapping).withOptions(options);
}

function multi(code: string, label: string, options: QuestionOption[], sourceSection: string) {
  return q(code, label, "MULTI_SELECT", sourceSection).withOptions(options);
}

function staticText(code: string, label: string): QuestionDefinition {
  return { code, label, sourceSection: "Certification", sourceText: label, type: "STATIC_TEXT" };
}

function repeatSection(code: string, titleText: string, repeatGroupCode: string, description?: string) {
  return { code, description, questions: [], repeatGroupCode, title: titleText };
}

function withRepeat(group: string) {
  return (question: QuestionDefinition) => ({ ...question, repeatGroup: group });
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

function toOption(label: string): QuestionOption {
  return { label, value: label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") };
}
