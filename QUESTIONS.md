# Open Questions

This document records unresolved business and design decisions discovered during Phase 2 questionnaire and domain analysis. These questions must be reviewed before database migrations, Prisma models, questionnaire screens, or reporting implementation.

## Person identity

1. Source documents collect names, birthdates, ages, gender, contact details, and role-specific details in many places. The ambiguity is that no source defines when two captured records represent the same real-world person. A future decision is required on manual matching, duplicate review, and whether automatic matching is allowed at all.
2. Business employees are captured with limited identity fields and no birthdate/contact. The ambiguity is whether employees should become full Person records or remain worker records until confirmed. A future decision is required on employee identity handling.
3. Tenants/renters are captured by name/contact in the Household Questionnaire but only as existence/payment questions in the Landowner Questionnaire. The ambiguity is whether tenants are always people, households, or businesses. A future decision is required on tenant identity type.

## Respondent vs subject

1. The Household Questionnaire captures respondent relationship to household head and separate household head details. The ambiguity is whether respondent=head can be assumed from relationship choice or must be explicitly confirmed. A future decision is required on linking respondent to subject person.
2. The Business Questionnaire captures respondent relationship to business owner and separate business owner details. The ambiguity is whether proxy respondents can answer all business sections and how authority is verified. A future decision is required on proxy respondent rules.
3. The Landowner Questionnaire captures respondent relationship to landowner and separate landowner details. The ambiguity is whether legal representatives, relatives, or occupants can answer for absent landowners. A future decision is required on acceptable respondent roles.

## Household

1. The Household Questionnaire has household head and spouse details plus a household member table that can include household head and wife/spouse. The ambiguity is whether the head/spouse must also be listed as members. A future decision is required for household size and population counts.
2. The household member table has printed rows, while the executive summary shows household sizes up to 17. The ambiguity is how many members must be supported and how separate sheets were encoded. A future decision is required to treat household members as unlimited repeatable records.
3. The executive summary relationship categories are more granular than the Household Questionnaire relationship choices. The ambiguity is whether those granular categories came from another coding sheet or later encoding. A future decision is required on authoritative household relationship categories.
4. The executive summary includes linguistic group, but the extracted Household Questionnaire text did not show a linguistic group field. The ambiguity is where linguistic group was collected. A future decision is required on source and questionnaire version.

## Business

1. The Business Questionnaire has singular Business Owner Details but ownership type includes partnership and corporation. The ambiguity is whether multiple owners should be captured. A future decision is required on business owner cardinality.
2. The Household Questionnaire says an associated structure used for business purposes should answer the Business Questionnaire. The ambiguity is whether that creates a linked module in the same interview or a separate business interview. A future decision is required on business module triggering.
3. The Landowner Questionnaire asks whether a business exists on owned land and whether the landowner owns it, but does not explicitly require the Business Questionnaire. The ambiguity is whether business-on-land triggers business survey workflow. A future decision is required on follow-up survey requirements.
4. Business employee rows include salary, residence, quarters, and financial memberships, but no contact/birthdate. The ambiguity is whether employees are affected persons requiring follow-up. A future decision is required on employee record depth.

## Land

1. Household asks about land occupied/claimed, Business asks about land where the business is located, and Landowner asks about land owned/occupied. The ambiguity is whether these are the same land parcel concept. A future decision is required on land parcel identity and matching.
2. Land ownership type, land type, current actual use, proof, acquisition, tax, mortgage, occupancy, and rent are not collected consistently across all questionnaires. The ambiguity is which fields are mandatory for each module. A future decision is required on minimum land data by role.
3. Trees/crops are captured as free text. The ambiguity is whether compensation requires structured crop/tree species, counts, ownership, valuation, or planting details. A future decision is required on tree/crop itemization.

## Structure

1. Household uses main structure tag and associated structure tags; Business uses structure tag number; Landowner asks whether a structure exists on land. The ambiguity is whether structure tags are globally unique and how untagged structures are handled. A future decision is required on structure identity.
2. Household associated structures are limited to same structure owners according to the source note. The ambiguity is how associated structures with different owners are recorded. A future decision is required on associated-structure ownership workflow.
3. Structure use, structure type, associated-structure type, material, and condition use different categories across questionnaires. The ambiguity is which classification should drive DMS reporting. A future decision is required on structure taxonomy.
4. A structure may host a household, business, tenants, or combinations of these. The ambiguity is whether multiple occupancies are allowed and how they are validated. A future decision is required on structure occupancy cardinality.

## Ownership

1. Ownership applies separately to land, structure, and business. The ambiguity is that source forms use different ownership categories and legal meanings. A future decision is required to keep ownership type domain-specific.
2. Landowner source includes individual, community ownership, and corporation. Business source includes single proprietorship, partnership, corporation, and others. The ambiguity is whether corporations/communities are modeled as persons, organizations, or text owners. A future decision is required on non-person owners.
3. Proof of ownership is free text in several forms. The ambiguity is whether proof types should be controlled lookup values. A future decision is required on accepted proof classifications.

## Occupancy

1. Household and Business ask if respondent/subject owns occupied structure or land and then ask occupancy arrangement or rent. The ambiguity is whether occupancy arrangement should be captured for owners as well as non-owners. A future decision is required on occupancy status values.
2. Landowner asks whether land is occupied by households and whether tenants are on the land. The ambiguity is whether occupants and tenants are separate categories or overlapping. A future decision is required on occupancy vs tenancy definitions.
3. Business asks if landowner consent exists when business does not own land. The ambiguity is whether consent documentation must be stored. A future decision is required on consent evidence.

## Employment

1. Household employment status values differ from Business employee values and executive-summary categories. The ambiguity is how contractual/temporary/permanent map to employed/self-employed/unemployed/not in labor force. A future decision is required on employment reporting categories.
2. Household member employment fields may depend on age, but the source does not define validation rules. A future decision is required on age-based employment validation.
3. Business employee total male/female fields may be manually captured or system-calculated. The ambiguity is whether to store respondent-stated totals. A future decision is required on employee total handling.

## Occupation

1. Household and Landowner collect occupation as questionnaire fields, while the executive summary uses major occupation groups. The ambiguity is who codes raw occupation into report groups. A future decision is required on occupation coding standard and workflow.
2. Household source asks primary occupation but Business employees have work assignment. The ambiguity is whether work assignment should map to occupation. A future decision is required on separating occupation from job assignment.

## Income

1. Source documents collect household member monthly income, household aggregate monthly income bracket, household head income sources, business average monthly income, and employee salary. The ambiguity is which one feeds the executive-summary income distribution. A future decision is required on income-report denominator and source.
2. Employee salary can be daily, weekly, or monthly. The ambiguity is whether exactly one frequency must be selected. A future decision is required on salary frequency validation.
3. Household savings ranges include an apparent text issue: `PhP6,000-,7999`. The ambiguity is whether this is a typo for `PhP6,000-7,999`. A future decision is required before implementing lookup values.
4. Member incomes may not reconcile with household aggregate income. The ambiguity is whether reconciliation is required or only flagged. A future decision is required on income consistency validation.

## Expenses

1. Household Part III collects expenditures by category and daily/weekly/monthly/yearly frequency, while Part VIII collects estimated monthly expenditure from all sources as a bracket. The ambiguity is which source feeds monthly expense distribution. A future decision is required on expense reporting source.
2. Business expenditures are average monthly business expenditures, not household expenses. The ambiguity is whether they are used in any shared report. A future decision is required on business finance reporting.
3. Category expenses may need frequency conversion. The ambiguity is which conversion rules to use. A future decision is required on daily/weekly/yearly normalization.

## Rent

1. Rent appears as household expense, rent received from renters/tenants, respondent-household rent paid, business structure rent, business land rent, employee-quarter rent, and landowner land/structure rental. The ambiguity is which rents are expenses, income, or occupancy charges. A future decision is required on rent context classification.
2. Landowner asks monthly rental for land and structure if being rented out. The ambiguity is payer identity and whether amounts are income to landowner. A future decision is required on payer/payee capture.
3. Business asks if employees' quarters are rented and monthly rate per employee. The ambiguity is whether employer or employee pays. A future decision is required on employee-quarter rent semantics.

## Skills

1. Current/preferred trade-skill lists differ from vocational-training sector lists. The ambiguity is whether these should be one taxonomy or separate taxonomies. A future decision is required on skill vs training classification.
2. Household asks skills of household members collectively, while Business asks skills of employees collectively and business owner separately. The ambiguity is whether skills are attached to individual persons or groups. A future decision is required on skill subject granularity.
3. `Others` appears in skill lists. The ambiguity is whether other values become new lookup options after review. A future decision is required on lookup governance.

## Validation

1. The source forms do not distinguish blank, No Response, Not Applicable, Unknown, and Missing. The ambiguity is how paper blanks should be interpreted during encoding. A future decision is required on response-state rules.
2. Executive summary includes No Response categories for some reports but not all. The ambiguity is whether no response was captured explicitly or inferred during encoding. A future decision is required on report missingness policy.
3. Cross-field validation examples such as age/birthdate, rent amount required when rent applies, and employee totals matching rows are not specified in source. A future decision is required on validation severity.

## Survey workflow

1. Paper forms include interviewee, field interviewer, and reviewer/supervisor certification. The ambiguity is how this maps to digital Draft, Ready to Sync, Synced, For Validation, Returned, Validated, and Finalized statuses. A future decision is required on workflow state transitions.
2. The source forms do not define reassignment or correction workflow. A future decision is required on who can return, edit, resubmit, validate, finalize, and reopen surveys.

## Survey review

1. Reviewer/supervisor certification is present but review criteria are not. The ambiguity is what must be checked before validation. A future decision is required on review checklist and validation issue categories.
2. It is unclear whether reviewer corrections modify original responses or add review notes. A future decision is required on audit trail and correction policy.

## Reporting

1. Executive-summary totals differ across household structure, household size, age, sex, civil status, education, religion, ethnicity, and language. The ambiguity is whether different filters or missingness rules were used. A future decision is required on denominator rules per report.
2. Monthly income distribution total is 463, which does not match household count 529 or population totals. The ambiguity is report denominator. A future decision is required on income distribution basis.
3. Employment status, primary occupation, and monthly expenses tables are blank in the inspected executive summary. The ambiguity is whether data was unavailable, pending, or intentionally omitted. A future decision is required on required final report outputs.
4. Executive summary categories sometimes do not match questionnaire categories. A future decision is required on category mapping ownership and approval.

## Questionnaire versioning

1. Source documents are dated/named `20220525`, but version labels inside the documents are not explicit. The ambiguity is how to identify authoritative questionnaire versions. A future decision is required on version naming and source-file registry.
2. The requested folder name and actual folder name differ: requested `questionnaires`, actual `questionaires`. The ambiguity is whether research source management has controlled locations. A future decision is required on source document inventory practice.
3. The executive summary may reflect encoded data or classifications not visible in the extracted questionnaire source. A future decision is required on whether additional coding sheets or Excel templates are authoritative questionnaire artifacts.

## Synchronization

1. Offline sync is required by project vision but not defined by paper sources. The ambiguity is how questionnaire version, response states, validation issues, and correction cycles travel between device and server. A future decision is required on sync payload boundaries.
2. If a submitted survey is returned for correction while the device is offline, the ambiguity is how conflicts are prevented. A future decision is required on assignment locking and revision handling.
3. Client-generated IDs are likely needed for offline records, but identity matching across persons, structures, land, and businesses is unresolved. A future decision is required on offline identifier strategy after domain review.

## Phase 6 questionnaire engine follow-ups

1. Module triggers are currently recommendations requiring explicit user action. The ambiguity is whether Household business-use structures should make Business required or merely recommended. A future decision is required on trigger severity policy.
2. Respondent prefill from normalized Person records is deferred. The ambiguity is how to show `PRE-FILLED` values separately from confirmed questionnaire responses. A future decision is required on prefill confirmation UX.
3. Business and Landowner triggers do not automatically create modules. The ambiguity is whether survey workflow should require one combined interview or separate interviews for some roles. A future decision is required on multi-role interview boundaries.
4. Signature blocks are captured as metadata only. The ambiguity is whether drawn signatures, typed acknowledgements, or uploaded images are legally required. A future decision is required on certification evidence.
5. Definition integrity is bundled in mobile tests. The ambiguity is whether future definition changes should be managed by a server-side authoring/review process. A future decision is required on questionnaire governance.
