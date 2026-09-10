import { QuestionnaireDefinition, QuestionOption } from "../types";

const yesNo: QuestionOption[] = [
  { label: "Yes", value: "YES" },
  { label: "No", value: "NO" }
];

const relationshipToHead: QuestionOption[] = [
  { label: "Household Head", value: "HOUSEHOLD_HEAD" },
  { label: "Wife/Spouse", value: "WIFE_SPOUSE" },
  { label: "Son/Daughter", value: "SON_DAUGHTER" },
  { label: "Grandson/Granddaughter", value: "GRANDCHILD" },
  { label: "Father/Mother", value: "PARENT" },
  { label: "Relative", value: "RELATIVE" },
  { label: "Non-relative", value: "NON_RELATIVE" },
  { label: "Other", value: "OTHER" }
];

const respondentRelationship: QuestionOption[] = [
  { label: "Household Head", value: "HOUSEHOLD_HEAD" },
  { label: "Wife/Husband", value: "WIFE_HUSBAND" },
  { label: "Mother/Father", value: "MOTHER_FATHER" },
  { label: "Daughter/Son", value: "DAUGHTER_SON" },
  { label: "Other", value: "OTHER" }
];

const civilStatus: QuestionOption[] = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Annulled", value: "ANNULLED" },
  { label: "Common Law/Live-in", value: "COMMON_LAW_LIVE_IN" },
  { label: "Widowed", value: "WIDOWED" },
  { label: "Single parent", value: "SINGLE_PARENT" }
];

const genderOptions: QuestionOption[] = [
  { label: "Female", value: "FEMALE" },
  { label: "Male", value: "MALE" },
  { label: "Other / specify in notes", value: "OTHER" }
];

const employmentStatus: QuestionOption[] = [
  { label: "Permanent", value: "PERMANENT" },
  { label: "Contractual", value: "CONTRACTUAL" },
  { label: "Temporary", value: "TEMPORARY" },
  { label: "Unemployed", value: "UNEMPLOYED" },
  { label: "Too young/old to work", value: "TOO_YOUNG_OLD_TO_WORK" }
];

const vulnerabilities: QuestionOption[] = [
  { label: "Baby/Toddler", value: "BABY_TODDLER" },
  { label: "Elderly", value: "ELDERLY" },
  { label: "Pregnant", value: "PREGNANT" },
  { label: "Seriously ill", value: "SERIOUSLY_ILL" },
  { label: "PWD", value: "PWD" },
  { label: "Other", value: "OTHER" }
];

const occupancyArrangement: QuestionOption[] = [
  { label: "Tenant/renter", value: "TENANT_RENTER" },
  { label: "Caretaker", value: "CARETAKER" },
  { label: "Other", value: "OTHER" }
];

export const household20220525V1: QuestionnaireDefinition = {
  deferredSections: ["Household Expenditure", "Assets And Debt", "Utilities And Services", "Land", "Trees/Crops", "Livelihood And Living Survey", "Relocation", "Certification/Signature Capture"],
  id: "household-20220525-v1",
  moduleType: "HOUSEHOLD",
  repeatGroups: [
    {
      code: "household.members",
      linkedDomainEntity: "Future Person + HouseholdMembership linkage; Phase 6B stores repeat responses only.",
      minOccurrences: 0,
      orderMatters: true,
      questions: [
        { code: "household.members.first_name", label: "First name", required: true, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.middle_name", label: "Middle name", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.last_name", label: "Last name", required: true, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.maiden_name", label: "Maiden name", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.relationship_to_head", label: "Relationship to household head", options: relationshipToHead, optionSource: { type: "INLINE_OPTIONS" }, required: true, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "SINGLE_SELECT" },
        { code: "household.members.civil_status", label: "Civil status", options: civilStatus, optionSource: { type: "INLINE_OPTIONS" }, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "SINGLE_SELECT" },
        { code: "household.members.birth_date", label: "Birth date", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "DATE" },
        { code: "household.members.age", label: "Age", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "INTEGER", validationRules: [{ message: "Age cannot be negative.", type: "MIN", value: 0 }] },
        { code: "household.members.gender", label: "Sex/Gender", options: genderOptions, optionSource: { type: "INLINE_OPTIONS" }, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "SINGLE_SELECT" },
        { code: "household.members.education", label: "Highest educational attainment", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.employment_status", label: "Employment status", options: employmentStatus, optionSource: { type: "INLINE_OPTIONS" }, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "SINGLE_SELECT" },
        { code: "household.members.work_location", label: "Work location", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.primary_occupation", label: "Primary occupation", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.monthly_income", label: "Monthly income (PhP)", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "MONEY" },
        { code: "household.members.vulnerabilities", label: "Vulnerabilities", options: vulnerabilities, optionSource: { type: "INLINE_OPTIONS" }, repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "MULTI_SELECT" },
        { code: "household.members.religion", label: "Religious affiliation", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" },
        { code: "household.members.ethnicity", label: "Ethnicity", repeatGroup: "household.members", sourceSection: "Part II - Household Profile", type: "TEXT" }
      ],
      title: "Household Members"
    }
  ],
  sections: [
    {
      code: "household.interview",
      questions: [
        { code: "household.interview.note", label: "Record the basic interview details. Project, barangay, and enumerator are also stored on the local interview when available.", type: "STATIC_TEXT" },
        { code: "household.interview.enumerator_name", label: "Enumerator's name", required: true, sourceSection: "Part I - Interview Record", type: "TEXT" },
        { code: "household.interview.survey_date", label: "Survey date", required: true, sourceSection: "Part I - Interview Record", type: "DATE" },
        { code: "household.interview.time_started", label: "Time started", sourceSection: "Part I - Interview Record", type: "TIME" },
        { code: "household.interview.time_finished", label: "Time finished", sourceSection: "Part I - Interview Record", type: "TIME" },
        { code: "household.structure.main_tag", label: "Main structure tag number", sourceSection: "Tag Structure Details", type: "TEXT" },
        { code: "household.structure.associated_tags_raw", label: "Associated structure tag/s, if any", sourceSection: "Tag Structure Details", type: "TEXTAREA" }
      ],
      title: "Interview Record"
    },
    {
      code: "household.respondent",
      questions: [
        { code: "household.respondent.last_name", label: "Last name", required: true, sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.first_name", label: "First name", required: true, sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.middle_name", label: "Middle name", sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.maiden_name", label: "Maiden name", sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.relationship_to_head", label: "Relationship to household head", options: respondentRelationship, optionSource: { type: "INLINE_OPTIONS" }, required: true, sourceSection: "Respondent Details", type: "SINGLE_SELECT" },
        { code: "household.respondent.birth_date", label: "Birth date", sourceSection: "Respondent Details", type: "DATE" },
        { code: "household.respondent.age", label: "Age", sourceSection: "Respondent Details", type: "INTEGER", validationRules: [{ message: "Age cannot be negative.", type: "MIN", value: 0 }] },
        { code: "household.respondent.gender", label: "Sex/Gender", options: genderOptions, optionSource: { type: "INLINE_OPTIONS" }, sourceSection: "Respondent Details", type: "SINGLE_SELECT" },
        { code: "household.respondent.contact_number", label: "Contact number", sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.email", label: "Email address", sourceSection: "Respondent Details", type: "TEXT" },
        { code: "household.respondent.valid_id_type", label: "Type of valid ID presented", sourceSection: "Respondent Details", type: "TEXT" }
      ],
      title: "Respondent Details"
    },
    {
      code: "household.head_spouse",
      questions: [
        { code: "household.head.first_name", label: "Household head first name", required: true, sourceSection: "Household Head Details", type: "TEXT" },
        { code: "household.head.middle_name", label: "Household head middle name", sourceSection: "Household Head Details", type: "TEXT" },
        { code: "household.head.last_name", label: "Household head last name", required: true, sourceSection: "Household Head Details", type: "TEXT" },
        { code: "household.head.birth_date", label: "Household head birth date", sourceSection: "Household Head Details", type: "DATE" },
        { code: "household.head.age", label: "Household head age", sourceSection: "Household Head Details", type: "INTEGER" },
        { code: "household.head.gender", label: "Household head sex/gender", options: genderOptions, optionSource: { type: "INLINE_OPTIONS" }, sourceSection: "Household Head Details", type: "SINGLE_SELECT" },
        { code: "household.spouse.first_name", label: "Spouse first name", sourceSection: "Household Head Spouse Details", type: "TEXT" },
        { code: "household.spouse.last_name", label: "Spouse last name", sourceSection: "Household Head Spouse Details", type: "TEXT" }
      ],
      title: "Household Head / Spouse"
    },
    { code: "household.members_section", description: "Add one repeat instance per household member. Printed paper rows are not treated as a maximum.", questions: [], title: "Household Members" },
    {
      code: "household.structure_occupancy",
      questions: [
        { code: "household.structure.owns_occupied_structure", label: "Do you own the structure/house you are occupying?", options: yesNo, optionSource: { type: "INLINE_OPTIONS" }, required: true, sourceSection: "Part VI - Structure Type and Ownership", type: "SINGLE_SELECT" },
        { code: "household.structure.occupancy_arrangement", label: "If no, what is the occupancy arrangement?", options: occupancyArrangement, optionSource: { type: "INLINE_OPTIONS" }, rules: [{ effect: "SHOW_IF", operator: "EQUALS", questionCode: "household.structure.owns_occupied_structure", value: "NO" }, { effect: "REQUIRE_IF", operator: "EQUALS", questionCode: "household.structure.owns_occupied_structure", value: "NO" }], sourceSection: "Part VI - Structure Type and Ownership", type: "SINGLE_SELECT" },
        { code: "household.structure.tenant_rent_paid", label: "If renter, how much is the monthly rate?", rules: [{ effect: "SHOW_IF", operator: "EQUALS", questionCode: "household.structure.occupancy_arrangement", value: "TENANT_RENTER" }, { effect: "REQUIRE_IF", operator: "EQUALS", questionCode: "household.structure.occupancy_arrangement", value: "TENANT_RENTER" }], sourceSection: "Part VI - Structure Type and Ownership", type: "MONEY" }
      ],
      title: "Structure / Occupancy"
    },
    {
      code: "household.project_awareness",
      questions: [
        { code: "household.project_awareness.aware", label: "Are you aware of the TLR/MRP: TDD project?", options: yesNo, optionSource: { type: "INLINE_OPTIONS" }, required: true, sourceSection: "Part IX - Project Awareness", type: "SINGLE_SELECT" },
        { code: "household.project_awareness.source", label: "If yes, where did you learn about the project?", rules: [{ effect: "SHOW_IF", operator: "EQUALS", questionCode: "household.project_awareness.aware", value: "YES" }, { effect: "REQUIRE_IF", operator: "EQUALS", questionCode: "household.project_awareness.aware", value: "YES" }], sourceSection: "Part IX - Project Awareness", type: "TEXT" },
        { code: "household.project_awareness.issues", label: "Issues and concerns about the project", sourceSection: "Part IX - Project Awareness", type: "TEXTAREA" },
        { code: "household.project_awareness.recommendations", label: "Recommendations to address issues and concerns", sourceSection: "Part IX - Project Awareness", type: "TEXTAREA" },
        { code: "household.project_awareness.benefits", label: "Perceived project benefits", sourceSection: "Part IX - Project Awareness", type: "TEXTAREA" }
      ],
      title: "Project Awareness"
    }
  ],
  sourceQuestionnaire: "20220525-TLR-Census-and-DMS-Survey_Households.docx",
  sourceVersion: "20220525-v1",
  title: "Household Questionnaire",
  versionCode: "INITIAL"
};
