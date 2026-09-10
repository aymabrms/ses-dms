import { FieldType, QuestionDefinition, QuestionnaireDefinition, QuestionOption } from "../types";

type BuilderQuestion = QuestionDefinition & { withOptions: (options: QuestionOption[]) => BuilderQuestion; withRule: (questionCode: string, value: string, required?: boolean) => QuestionDefinition; withRepeat: (group: string) => QuestionDefinition };

const yesNo: QuestionOption[] = [
  { label: "Yes", value: "YES" },
  { label: "No", value: "NO" }
];
const genderOptions: QuestionOption[] = [{ label: "Female", value: "FEMALE" }, { label: "Male", value: "MALE" }, { label: "Other / specify", value: "OTHER" }];
const relationshipToHead: QuestionOption[] = ["Household Head", "Wife/Spouse", "Son/Daughter", "Grandson/Granddaughter", "Father/Mother", "Relative", "Non-relative", "Other"].map(toOption);
const respondentRelationship: QuestionOption[] = ["Household Head", "Wife/Husband", "Mother/Father", "Daughter/Son", "Other"].map(toOption);
const civilStatus: QuestionOption[] = ["Single", "Married", "Annulled", "Common Law/Live-in", "Widowed", "Single parent"].map(toOption);
const employmentStatus: QuestionOption[] = ["Permanent", "Contractual", "Temporary", "Unemployed", "Too young/old to work"].map(toOption);
const vulnerabilities: QuestionOption[] = ["Baby/Toddler", "Elderly", "Pregnant", "Seriously ill", "PWD", "Other"].map(toOption);
const occupancyArrangement: QuestionOption[] = ["Tenant/renter", "Caretaker", "Other"].map(toOption);
const structureUse: QuestionOption[] = ["Residential", "Commercial", "Industrial", "Other"].map(toOption);
const structureType: QuestionOption[] = ["Single Detached", "Duplex", "Townhouse", "Other"].map(toOption);
const structureCondition: QuestionOption[] = ["Occupied", "Abandoned/Vacant", "Under Construction"].map(toOption);
const associatedStructureType: QuestionOption[] = ["Fence with gate", "Fence", "Shed", "Garage", "Toilet", "Pig pen", "Other"].map(toOption);
const associatedMaterial: QuestionOption[] = ["Concrete", "Semi-concrete", "Light material", "Salvaged material", "Other"].map(toOption);
const landType: QuestionOption[] = ["Private", "Public", "Right-Of-Way", "Ancestral Domain"].map(toOption);
const landOwnershipType: QuestionOption[] = ["Individual", "Community Ownership", "Corporation"].map(toOption);
const landUse: QuestionOption[] = ["Residential", "Commercial", "Industrial", "Agricultural", "Other"].map(toOption);
const treePlanter: QuestionOption[] = ["Landowner", "Household occupying the land", "Others/third party"].map(toOption);
const tripPurpose: QuestionOption[] = ["Work", "Home", "School", "Shopping/Malling", "Market", "Other"].map(toOption);
const programs: QuestionOption[] = ["Scholarship", "4Ps/Conditional Cash Transfer", "PhilHealth", "Supplemental Feeding", "Subsidized rice", "Housing program", "Other"].map(toOption);
const skills: QuestionOption[] = ["Carpentry", "Plumbing", "Welding", "Beauty Care", "Cooking", "Sewing", "Driving", "Basic Computer Operation", "Mechanic", "Industrial Painting", "Computer Technician", "Hair Dressing", "Food Processing", "Handicrafts Making", "Other"].map(toOption);
const incomeLocations: QuestionOption[] = ["Own Residence", "Within barangay", "Near barangay", "Within City", "Other City/Municipality", "Overseas", "Other"].map(toOption);
const financialInstitutions: QuestionOption[] = ["Pagibig Fund", "SSS", "Cooperative", "GSIS", "Other"].map(toOption);
const relocationYears: QuestionOption[] = ["<1 year", "1-5 years", "6-10 years", "11-15 years", "16-20 years", ">20 years"].map(toOption);
const relocationConsiderations: QuestionOption[] = ["Proximity to work/livelihood opportunities", "Proximity to schools", "Proximity to church", "Proximity to recreational activities", "Proximity to hospitals/health facilities", "Access to basic utilities", "Access to public transportation", "Other"].map(toOption);
const brackets: QuestionOption[] = ["PhP0-999", "PhP 1,000-1,999", "PhP 2,000-3,999", "PhP 4,000-5,999", "PhP6,000-7,999 (source typo reviewed)", "PhP8,000-9,999", "PhP 10,000-11,999", "PhP12,000-15,999", "PhP16,000-19,999", "PhP20,000-24,999", "PhP25,000-29,999", "PhP30,000-49,999", "PhP50,000-above"].map(toOption);

const householdMemberQuestions: QuestionDefinition[] = [
  q("household.members.first_name", "First name", "TEXT", "Part II - Household Profile", true, { entity: "Person", field: "firstName", target: "BOTH" }, { topic: "household_demographics", category: "name" }),
  q("household.members.middle_name", "Middle name", "TEXT", "Part II - Household Profile"),
  q("household.members.last_name", "Last name", "TEXT", "Part II - Household Profile", true, { entity: "Person", field: "lastName", target: "BOTH" }, { topic: "household_demographics", category: "name" }),
  q("household.members.maiden_name", "Maiden name", "TEXT", "Part II - Household Profile"),
  select("household.members.relationship_to_head", "Relationship to household head", relationshipToHead, "Part II - Household Profile", true, { entity: "HouseholdMembership", field: "relationshipToHeadRaw", target: "BOTH" }, { topic: "household_structure", category: "relationship" }),
  select("household.members.civil_status", "Civil status", civilStatus, "Part II - Household Profile", false, { target: "RESPONSE_ONLY" }, { topic: "demographics", category: "civil_status" }),
  q("household.members.birth_date", "Birth date", "DATE", "Part II - Household Profile", false, { entity: "Person", field: "birthDate", target: "BOTH" }),
  q("household.members.age", "Age", "INTEGER", "Part II - Household Profile", false, { target: "RESPONSE_ONLY" }, { topic: "demographics", category: "age" }),
  select("household.members.gender", "Sex/Gender", genderOptions, "Part II - Household Profile", false, { entity: "Person", field: "genderRaw", target: "BOTH" }, { topic: "demographics", category: "sex" }),
  q("household.members.education", "Highest educational attainment", "TEXT", "Part II - Household Profile", false, { target: "UNRESOLVED" }, { topic: "demographics", category: "education" }),
  select("household.members.employment_status", "Employment status", employmentStatus, "Part II - Household Profile", false, { target: "UNRESOLVED" }, { topic: "livelihood", category: "employment_status" }),
  q("household.members.work_location", "Work location", "TEXT", "Part II - Household Profile"),
  q("household.members.primary_occupation", "Primary occupation", "TEXT", "Part II - Household Profile", false, { target: "UNRESOLVED" }, { topic: "livelihood", category: "occupation" }),
  q("household.members.monthly_income", "Monthly income (PhP)", "MONEY", "Part II - Household Profile", false, { target: "RESPONSE_ONLY" }, { topic: "livelihood", category: "member_income" }),
  multi("household.members.vulnerabilities", "Vulnerabilities", vulnerabilities, "Part II - Household Profile"),
  q("household.members.religion", "Religious affiliation", "TEXT", "Part II - Household Profile"),
  q("household.members.ethnicity", "Ethnicity", "TEXT", "Part II - Household Profile")
].map(withRepeat("household.members"));

export const household20220525V1: QuestionnaireDefinition = {
  deferredSections: ["Full signature capture/media", "final taxonomy normalization", "computed expenditure normalization", "normalized member/person creation from repeat rows"],
  id: "household-20220525-v1",
  moduleType: "HOUSEHOLD",
  repeatGroups: [
    { code: "household.members", linkedDomainEntity: "Future Person + HouseholdMembership linkage; Phase 6C still stores repeat responses immediately.", minOccurrences: 0, orderMatters: true, questions: householdMemberQuestions, title: "Household Members" },
    { code: "household.associated_structures", linkedDomainEntity: "Future Structure + StructureAssociation linkage.", minOccurrences: 0, orderMatters: true, questions: [q("household.associated_structures.tag", "Structure tag number", "TEXT", "Part VI - Associated Structures", true), select("household.associated_structures.type", "Type of associated structure", associatedStructureType, "Part VI - Associated Structures"), select("household.associated_structures.material", "Material of associated structure", associatedMaterial, "Part VI - Associated Structures"), select("household.associated_structures.used_for_business", "Used for business purposes?", yesNo, "Part VI - Associated Structures", false, { target: "RESPONSE_ONLY" }, undefined, { level: "RECOMMENDED", message: "Business questionnaire may be required.", moduleType: "BUSINESS" })].map(withRepeat("household.associated_structures")), title: "Associated Structures" },
    { code: "household.land.trees_crops", linkedDomainEntity: "Future TreeCropRecord; itemization remains flexible.", minOccurrences: 0, orderMatters: true, questions: [q("household.land.trees_crops.description", "Tree/crop description", "TEXT", "Part VII - Trees and Crops", true), select("household.land.trees_crops.planter", "Who planted it?", treePlanter, "Part VII - Trees and Crops"), q("household.land.trees_crops.payment_arrangement", "Payment/proceeds arrangement", "TEXTAREA", "Part VII - Trees and Crops"), q("household.land.trees_crops.remarks", "Remarks", "TEXTAREA", "Part VII - Trees and Crops")].map(withRepeat("household.land.trees_crops")), title: "Trees / Crops" },
    feedbackGroup("household.feedback.issues", "Issues / Concerns"),
    feedbackGroup("household.feedback.recommendations", "Recommendations"),
    feedbackGroup("household.feedback.benefits", "Perceived Benefits"),
    feedbackGroup("household.feedback.livelihood_preferences", "Livelihood Preferences")
  ],
  sections: [
    { code: "household.interview", questions: [staticText("household.interview.note", "Record the basic interview details. Project, barangay, and enumerator are also stored on the local interview when available."), q("household.interview.enumerator_name", "Enumerator's name", "TEXT", "Part I - Interview Record", true), q("household.interview.survey_date", "Survey date", "DATE", "Part I - Interview Record", true), q("household.interview.time_started", "Time started", "TIME", "Part I - Interview Record"), q("household.interview.time_finished", "Time finished", "TIME", "Part I - Interview Record"), q("household.structure.main_tag", "Main structure tag number", "TEXT", "Tag Structure Details"), q("household.structure.associated_tags_raw", "Associated structure tag/s, if any", "TEXTAREA", "Tag Structure Details")], title: "Interview Record" },
    { code: "household.respondent", questions: [q("household.respondent.last_name", "Last name", "TEXT", "Respondent Details", true), q("household.respondent.first_name", "First name", "TEXT", "Respondent Details", true), q("household.respondent.middle_name", "Middle name", "TEXT", "Respondent Details"), q("household.respondent.maiden_name", "Maiden name", "TEXT", "Respondent Details"), select("household.respondent.relationship_to_head", "Relationship to household head", respondentRelationship, "Respondent Details", true), q("household.respondent.birth_date", "Birth date", "DATE", "Respondent Details"), q("household.respondent.age", "Age", "INTEGER", "Respondent Details"), select("household.respondent.gender", "Sex/Gender", genderOptions, "Respondent Details"), q("household.respondent.contact_number", "Contact number", "TEXT", "Respondent Details"), q("household.respondent.email", "Email address", "TEXT", "Respondent Details"), q("household.respondent.valid_id_type", "Type of valid ID presented", "TEXT", "Respondent Details")], title: "Respondent Details" },
    { code: "household.head_spouse", questions: [q("household.head.first_name", "Household head first name", "TEXT", "Household Head Details", true), q("household.head.middle_name", "Household head middle name", "TEXT", "Household Head Details"), q("household.head.last_name", "Household head last name", "TEXT", "Household Head Details", true), q("household.head.birth_date", "Household head birth date", "DATE", "Household Head Details"), q("household.head.age", "Household head age", "INTEGER", "Household Head Details"), select("household.head.gender", "Household head sex/gender", genderOptions, "Household Head Details"), q("household.spouse.first_name", "Spouse first name", "TEXT", "Household Head Spouse Details"), q("household.spouse.last_name", "Spouse last name", "TEXT", "Household Head Spouse Details")], title: "Household Head / Spouse" },
    repeatSection("household.members_section", "Household Members", "household.members", "Add one repeat instance per household member. Printed paper rows are not treated as a maximum."),
    { code: "household.expenditure", questions: expenditureQuestions(), title: "Household Expenditure" },
    { code: "household.assets_debt", questions: [q("household.assets.radio_count", "Radio count", "INTEGER", "Part IV - Assets"), q("household.assets.television_count", "Television count", "INTEGER", "Part IV - Assets"), q("household.assets.refrigerator_count", "Refrigerator count", "INTEGER", "Part IV - Assets"), q("household.assets.sala_set_count", "Sala set count", "INTEGER", "Part IV - Assets"), q("household.assets.dining_set_count", "Dining set count", "INTEGER", "Part IV - Assets"), q("household.assets.car_jeep_count", "Car/Jeep count", "INTEGER", "Part IV - Assets"), q("household.assets.tricycle_count", "Tricycle count", "INTEGER", "Part IV - Assets"), q("household.assets.washing_machine_count", "Washing machine count", "INTEGER", "Part IV - Assets"), q("household.assets.gas_stove_count", "Gas stove/range count", "INTEGER", "Part IV - Assets"), q("household.assets.mobile_phone_count", "Telephone/mobile count", "INTEGER", "Part IV - Assets"), q("household.assets.computer_count", "Computer count", "INTEGER", "Part IV - Assets"), select("household.debt.has_debt", "Do you have any debt now?", yesNo, "Part IV - Assets"), q("household.debt.amount", "If yes, how much?", "MONEY", "Part IV - Assets").withRule("household.debt.has_debt", "YES"), q("household.debt.source", "Debt source", "TEXT", "Part IV - Assets").withRule("household.debt.has_debt", "YES")], title: "Assets And Debt" },
    { code: "household.utilities_services", questions: utilityQuestions(), title: "Utilities And Services" },
    { code: "household.structure_occupancy", questions: structureQuestions(), title: "Structure / Occupancy" },
    repeatSection("household.associated_structures_section", "Associated Structures", "household.associated_structures", "Only list structures with same structure owners. Business-use answers surface a Business questionnaire recommendation."),
    { code: "household.land", questions: landQuestions(), title: "Land" },
    repeatSection("household.land.trees_crops_section", "Trees / Crops", "household.land.trees_crops", "Use one item per tree/crop detail where itemization is useful; source itemization remains ambiguous."),
    { code: "household.livelihood", questions: livelihoodQuestions(), title: "Livelihood And Living Survey" },
    { code: "household.financial_brackets", questions: [select("household.finance.savings_bracket", "Estimated household monthly savings", brackets, "Part VIII - Livelihood and Living Survey"), select("household.finance.income_bracket", "Estimated household monthly income from all sources", brackets, "Part VIII - Livelihood and Living Survey"), select("household.finance.expenditure_bracket", "Estimated household monthly expenditure from all sources", brackets, "Part VIII - Livelihood and Living Survey")], title: "Household Financial Brackets" },
    { code: "household.relocation", questions: relocationQuestions(), title: "Relocation / Resettlement Preferences" },
    { code: "household.project_awareness", questions: [select("household.project_awareness.aware", "Are you aware of the TLR/MRP: TDD project?", yesNo, "Part IX - Project Awareness", true), q("household.project_awareness.source", "If yes, where did you learn about the project?", "TEXT", "Part IX - Project Awareness").withRule("household.project_awareness.aware", "YES", true)], title: "Project Awareness" },
    repeatSection("household.feedback.issues_section", "Issues / Concerns", "household.feedback.issues"),
    repeatSection("household.feedback.recommendations_section", "Recommendations", "household.feedback.recommendations"),
    repeatSection("household.feedback.benefits_section", "Perceived Project Benefits", "household.feedback.benefits"),
    repeatSection("household.feedback.livelihood_preferences_section", "Livelihood Restoration Preferences", "household.feedback.livelihood_preferences"),
    { code: "household.certification", questions: [staticText("household.certification.respondent_text", "I hereby certify that all data entered hereto are true and correct to the best of my knowledge."), select("household.certification.respondent_acknowledged", "Respondent/interviewee certification acknowledged", yesNo, "Certification"), q("household.certification.respondent_date", "Respondent certification date", "DATE", "Certification"), q("household.certification.interviewer_name", "Field interviewer name", "TEXT", "Certification"), q("household.certification.interviewer_date", "Field interviewer certification date", "DATE", "Certification"), q("household.certification.reviewer_name", "Reviewer/Supervisor name", "TEXT", "Certification"), q("household.certification.reviewer_date", "Reviewer/Supervisor date", "DATE", "Certification")], title: "Certification Metadata" }
  ],
  sourceQuestionnaire: "20220525-TLR-Census-and-DMS-Survey_Households.docx",
  sourceVersion: "20220525-v1",
  title: "Household Questionnaire",
  versionCode: "INITIAL"
};

function expenditureQuestions(): QuestionDefinition[] {
  const categories = ["rent", "house_amortization", "electricity", "water", "transportation", "food", "clothing", "medicine", "education", "others"];
  const periods = ["daily", "weekly", "monthly", "yearly"];
  return categories.flatMap((category) => periods.map((period) => q(`household.expenditure.${category}.${period}`, `${title(category)} - ${period}`, "MONEY", "Part III - Household Expenditure")));
}

function utilityQuestions(): QuestionDefinition[] {
  return [select("household.utilities.power_access", "Access to power", yesNo, "Part V - Access to Utilities/Services"), q("household.utilities.power_supplier", "Power supplier", "TEXT", "Part V - Access to Utilities/Services").withRule("household.utilities.power_access", "YES"), select("household.utilities.water_access", "Access to water", yesNo, "Part V - Access to Utilities/Services"), q("household.utilities.water_supplier", "Water supplier/source", "TEXT", "Part V - Access to Utilities/Services").withRule("household.utilities.water_access", "YES"), q("household.utilities.sanitation", "Sanitation access/details", "TEXT", "Part V - Access to Utilities/Services"), q("household.utilities.solid_waste_disposal", "Where do you dispose your solid waste?", "TEXTAREA", "Part V - Access to Utilities/Services"), select("household.utilities.has_septic_tank", "Do you have a septic tank?", yesNo, "Part V - Access to Utilities/Services"), q("household.utilities.liquid_waste_disposal", "Where do you dispose liquid wastes?", "TEXTAREA", "Part V - Access to Utilities/Services"), q("household.utilities.cooking_fuel", "Main fuel used for cooking", "TEXT", "Part V - Access to Utilities/Services"), q("household.services.educational_facilities", "Educational facilities in the community", "TEXTAREA", "Part V - Access to Utilities/Services"), select("household.transport.uses_public_transport", "Do you use public transportation?", yesNo, "Part V - Access to Utilities/Services"), multi("household.transport.trip_purpose", "Common trip purpose", tripPurpose, "Part V - Access to Utilities/Services").withRule("household.transport.uses_public_transport", "YES"), multi("household.programs.access", "Access to government programs", programs, "Part V - Access to Utilities/Services"), q("household.programs.other", "Other government program", "TEXT", "Part V - Access to Utilities/Services")];
}

function structureQuestions(): QuestionDefinition[] {
  return [select("household.structure.use", "Use of structure occupied", structureUse, "Part VI - Structure Type and Ownership"), select("household.structure.type", "Type of structure occupied", structureType, "Part VI - Structure Type and Ownership"), select("household.structure.condition", "Status/condition of use", structureCondition, "Part VI - Structure Type and Ownership"), select("household.structure.rents_out", "Do you rent out the structure?", yesNo, "Part VI - Structure Type and Ownership"), q("household.structure.renter_count", "How many renters/tenants?", "INTEGER", "Part VI - Structure Type and Ownership").withRule("household.structure.rents_out", "YES"), q("household.structure.average_rent_received", "Average rent per month from renters/tenants", "MONEY", "Part VI - Structure Type and Ownership").withRule("household.structure.rents_out", "YES"), select("household.structure.owns_occupied_structure", "Do you own the structure/house you are occupying?", yesNo, "Part VI - Structure Type and Ownership", true), select("household.structure.occupancy_arrangement", "If no, what is the occupancy arrangement?", occupancyArrangement, "Part VI - Structure Type and Ownership").withRule("household.structure.owns_occupied_structure", "NO", true), q("household.structure.tenant_rent_paid", "If renter, how much is the monthly rate?", "MONEY", "Part VI - Structure Type and Ownership").withRule("household.structure.occupancy_arrangement", "TENANT_RENTER", true), select("household.structure.has_associated_structures", "Is there any associated structure?", yesNo, "Part VI - Structure Type and Ownership")];
}

function landQuestions(): QuestionDefinition[] {
  return [select("household.land.land_type", "Type of land occupied", landType, "Part VII - Type and Ownership of Affected Land"), select("household.land.ownership_type", "Type of ownership of land occupied", landOwnershipType, "Part VII - Type and Ownership of Affected Land"), select("household.land.owns_claimed_land", "Do you own the land you occupy/claim?", yesNo, "Part VII - Type and Ownership of Affected Land"), q("household.land.proof_of_ownership", "Proof of ownership", "TEXT", "Part VII - Type and Ownership of Affected Land").withRule("household.land.owns_claimed_land", "YES"), q("household.land.acquisition_method", "How did you acquire the land?", "TEXT", "Part VII - Type and Ownership of Affected Land").withRule("household.land.owns_claimed_land", "YES"), select("household.land.real_estate_tax_paid", "Do you pay real estate tax for the land?", yesNo, "Part VII - Type and Ownership of Affected Land"), select("household.land.mortgaged", "Is land on loan or used as mortgage?", yesNo, "Part VII - Type and Ownership of Affected Land"), q("household.land.area", "Area of land occupied (ha or m2)", "DECIMAL", "Part VII - Type and Ownership of Affected Land"), select("household.land.actual_use", "Current actual use of land", landUse, "Part VII - Type and Ownership of Affected Land"), q("household.land.stay_status", "If not landowner, status of stay in the land", "TEXT", "Part VII - Type and Ownership of Affected Land").withRule("household.land.owns_claimed_land", "NO"), q("household.land.rent_paid", "If renter, monthly rent for use of land", "MONEY", "Part VII - Type and Ownership of Affected Land").withRule("household.land.owns_claimed_land", "NO"), select("household.land.has_trees_crops", "Are there trees and crops planted on the land?", yesNo, "Part VII - Trees and Crops")];
}

function livelihoodQuestions(): QuestionDefinition[] {
  return [q("household.livelihood.primary_income_land_based", "Primary source: land-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.primary_income_enterprise_based", "Primary source: enterprise-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.primary_income_wage_based", "Primary source: wage-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.primary_income_other", "Primary source: other", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.secondary_income_land_based", "Secondary source: land-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.secondary_income_enterprise_based", "Secondary source: enterprise-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.secondary_income_wage_based", "Secondary source: wage-based kind", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.secondary_income_other", "Secondary source: other", "TEXT", "Part VIII - Livelihood and Living Survey"), q("household.livelihood.household_head_employment_status", "Status of employment", "TEXT", "Part VIII - Livelihood and Living Survey"), multi("household.livelihood.current_skills", "Current skills/expertise of household members", skills, "Part VIII - Livelihood and Living Survey"), multi("household.livelihood.preferred_skills", "Preferred skills/expertise of household members", skills, "Part VIII - Livelihood and Living Survey"), select("household.livelihood.income_location", "Location of household head/member primary source of income", incomeLocations, "Part VIII - Livelihood and Living Survey"), multi("household.finance.financial_institution_memberships", "Financial institution memberships", financialInstitutions, "Part VIII - Livelihood and Living Survey")];
}

function relocationQuestions(): QuestionDefinition[] {
  return [select("household.relocation.previously_relocated", "Have you been relocated in the past?", yesNo, "Part VIII - Relocation"), q("household.relocation.previous_reason", "If yes, state reason", "TEXTAREA", "Part VIII - Relocation").withRule("household.relocation.previously_relocated", "YES"), select("household.relocation.availed_housing_program", "Have you availed of government housing programs?", yesNo, "Part VIII - Relocation"), q("household.relocation.housing_program", "If yes, state housing program", "TEXT", "Part VIII - Relocation").withRule("household.relocation.availed_housing_program", "YES"), q("household.relocation.preference", "Relocation preference", "TEXTAREA", "Part VIII - Relocation"), select("household.relocation.years_residing", "Years residing in current household/place", relocationYears, "Part VIII - Relocation"), multi("household.relocation.site_considerations", "Considerations for preferred relocation site", relocationConsiderations, "Part VIII - Relocation"), select("household.relocation.is_primary_residence", "Is your house your primary residence?", yesNo, "Part VIII - Relocation"), q("household.relocation.primary_residence_place", "If no, primary place of residence", "TEXT", "Part VIII - Relocation").withRule("household.relocation.is_primary_residence", "NO"), q("household.relocation.reason_for_present_location", "Reason for establishing in present location", "TEXTAREA", "Part VIII - Relocation")];
}

function feedbackGroup(code: string, titleText: string) {
  return { code, linkedDomainEntity: "Response-only project feedback item.", minOccurrences: 0, orderMatters: true, questions: [q(`${code}.text`, titleText, "TEXTAREA", "Part IX - Project Awareness", true).withRepeat(code)], title: titleText };
}

function q(code: string, label: string, type: FieldType, sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"], triggerRecommendation?: QuestionDefinition["triggerRecommendation"]): BuilderQuestion {
  const question: QuestionDefinition = { code, domainMapping: domainMapping ?? { target: "RESPONSE_ONLY" }, label, reportingMapping, required, sourceSection, sourceText: label, triggerRecommendation, type };
  return addBuilders(question);
}

function select(code: string, label: string, options: QuestionOption[], sourceSection: string, required = false, domainMapping?: QuestionDefinition["domainMapping"], reportingMapping?: QuestionDefinition["reportingMapping"], triggerRecommendation?: QuestionDefinition["triggerRecommendation"]) {
  return q(code, label, "SINGLE_SELECT", sourceSection, required, domainMapping, reportingMapping, triggerRecommendation).withOptions(options);
}

function multi(code: string, label: string, options: QuestionOption[], sourceSection: string) {
  return q(code, label, "MULTI_SELECT", sourceSection).withOptions(options);
}

function staticText(code: string, label: string): QuestionDefinition {
  return { code, label, sourceSection: "Instruction", sourceText: label, type: "STATIC_TEXT" };
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

function title(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}
