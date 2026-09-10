# Question Code Catalog

This catalog summarizes the bundled Phase 6 definitions. Detailed labels and source text remain in the definition files.

## Catalog Columns

- Module: questionnaire module type.
- Section: definition section code.
- Question codes: stable semantic codes or code families.
- Field types: field types used in the section.
- Repeat group: repeat group when applicable.
- Option source: inline options or none.
- Domain/reporting mapping: present where the definition includes `domainMapping` or `reportingMapping`.
- Source section: source questionnaire area.
- Status: implemented, partial, deferred, or unresolved.

## Household

| Section | Question Codes | Field Types | Repeat Group | Option Source | Mapping | Source Section | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `household.interview` | `household.interview.*`, `household.structure.main_tag`, `household.structure.associated_tags_raw` | TEXT, DATE, TIME, TEXTAREA, STATIC_TEXT | none | none | response/interview evidence | Part I | IMPLEMENTED |
| `household.respondent` | `household.respondent.*` | TEXT, DATE, INTEGER, SINGLE_SELECT | none | INLINE_OPTIONS for gender/relationship | response-only | Respondent Details | IMPLEMENTED |
| `household.head_spouse` | `household.head.*`, `household.spouse.*` | TEXT, DATE, INTEGER, SINGLE_SELECT | none | INLINE_OPTIONS for gender | Person-like metadata | Household Head Details | IMPLEMENTED |
| `household.members_section` | `household.members.*` | TEXT, DATE, INTEGER, MONEY, SINGLE_SELECT, MULTI_SELECT | `household.members` | INLINE_OPTIONS | Person/HouseholdMembership metadata where safe | Part II | IMPLEMENTED |
| `household.expenditure` | `household.expenditure.<category>.<period>` | MONEY | none | none | response-only finance | Part III | IMPLEMENTED |
| `household.assets_debt` | `household.assets.*`, `household.debt.*` | INTEGER, MONEY, TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Part IV | IMPLEMENTED |
| `household.utilities_services` | `household.utilities.*`, `household.transport.*`, `household.programs.*` | TEXT, TEXTAREA, SINGLE_SELECT, MULTI_SELECT | none | INLINE_OPTIONS | response-only | Part V | IMPLEMENTED |
| `household.structure_occupancy` | `household.structure.*` | TEXT, INTEGER, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | structure/occupancy metadata | Part VI | IMPLEMENTED |
| `household.associated_structures_section` | `household.associated_structures.*` | TEXT, SINGLE_SELECT | `household.associated_structures` | INLINE_OPTIONS | future structure association | Part VI | IMPLEMENTED |
| `household.land` | `household.land.*` | TEXT, DECIMAL, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | land metadata where safe | Part VII | IMPLEMENTED |
| `household.land.trees_crops_section` | `household.land.trees_crops.*` | TEXT, TEXTAREA, SINGLE_SELECT | `household.land.trees_crops` | INLINE_OPTIONS | response-only | Part VII | PARTIAL |
| `household.livelihood`, `household.financial_brackets`, `household.relocation` | `household.livelihood.*`, `household.finance.*`, `household.relocation.*` | TEXT, TEXTAREA, SINGLE_SELECT, MULTI_SELECT | none | INLINE_OPTIONS | response-only | Part VIII | IMPLEMENTED |
| `household.project_awareness` | `household.project_awareness.*` | TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Part IX | IMPLEMENTED |
| feedback sections | `household.feedback.*.text` | TEXTAREA | feedback repeat groups | none | response-only | Part IX | IMPLEMENTED |
| `household.certification` | `household.certification.*` | STATIC_TEXT, TEXT, DATE, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Certification | PARTIAL |

## Business

| Section | Question Codes | Field Types | Repeat Group | Option Source | Mapping | Source Section | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `business.interview` | `business.interview.*`, `business.structure.tag` | TEXT, DATE, TIME | none | none | response-only | Part I | IMPLEMENTED |
| `business.respondent`, `business.owner` | `business.respondent.*`, `business.owner.*` | TEXT, DATE, INTEGER, SINGLE_SELECT | none | INLINE_OPTIONS for gender | response/person-like metadata | Part I | IMPLEMENTED |
| `business.profile` | `business.profile.*` | TEXT, DATE, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | Business and finance metadata | Part II | IMPLEMENTED |
| `business.employees_section` | `business.employees.*` | TEXT, INTEGER, MONEY, SINGLE_SELECT, MULTI_SELECT | `business.employees` | INLINE_OPTIONS | BusinessEmployee/person metadata where safe | Part II | IMPLEMENTED |
| `business.employee_totals` | `business.employees.total_*`, `business.employees.quarters_*` | INTEGER, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Part II | IMPLEMENTED |
| `business.employee_skills` | `business.employee_skills.*` | MULTI_SELECT | none | INLINE_OPTIONS | response-only | Part II | IMPLEMENTED |
| `business.structure_occupancy` | `business.structure.*` | TEXT, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | structure/occupancy metadata | Part III | IMPLEMENTED |
| `business.land` | `business.land.*` | TEXTAREA, MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | land/occupancy metadata | Part III | IMPLEMENTED |
| livelihood sections | `business.owner_livelihood.*`, `business.employee_livelihood.*` | MULTI_SELECT | none | INLINE_OPTIONS | response-only | Parts IV-V | IMPLEMENTED |
| `business.project_awareness` | `business.project_awareness.*` | TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Part VI | IMPLEMENTED |
| feedback sections | `business.feedback.*.text` | TEXTAREA | feedback repeat groups | none | response-only | Part VI | IMPLEMENTED |
| `business.certification` | `business.certification.*` | STATIC_TEXT, TEXT, DATE, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Certification | PARTIAL |

## Landowner

| Section | Question Codes | Field Types | Repeat Group | Option Source | Mapping | Source Section | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `landowner.interview` | `landowner.interview.*` | TEXT, DATE, TIME | none | none | response-only | Part I | IMPLEMENTED |
| `landowner.respondent`, `landowner.owner`, `landowner.spouse` | `landowner.respondent.*`, `landowner.owner.*`, `landowner.spouse.*` | TEXT, DATE, INTEGER, SINGLE_SELECT | none | INLINE_OPTIONS for relationship/gender | response/person-like metadata | Part I | IMPLEMENTED |
| `landowner.land` | `landowner.land.*` | TEXTAREA, DECIMAL, SINGLE_SELECT | none | INLINE_OPTIONS | LandParcel metadata where safe | Affected Land | IMPLEMENTED |
| `landowner.structure` | `landowner.structure.*` | TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | Structure metadata where safe | Affected Land | IMPLEMENTED |
| `landowner.business` | `landowner.business.*` | TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | Business metadata where safe | Affected Land | IMPLEMENTED |
| `landowner.rental_tenancy` | `landowner.rent.*`, `landowner.tenants.*` | MONEY, SINGLE_SELECT | none | INLINE_OPTIONS | response-only rent/tenancy | Affected Land | IMPLEMENTED |
| `landowner.trees_crops` | `landowner.trees_crops.*` | TEXTAREA, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Affected Land | PARTIAL |
| `landowner.project_awareness` | `landowner.project_awareness.*` | TEXT, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Project Awareness | IMPLEMENTED |
| feedback sections | `landowner.feedback.*.text` | TEXTAREA | feedback repeat groups | none | response-only | Project Feedback | IMPLEMENTED |
| `landowner.certification` | `landowner.certification.*` | STATIC_TEXT, TEXT, DATE, SINGLE_SELECT | none | INLINE_OPTIONS | response-only | Certification | PARTIAL |
