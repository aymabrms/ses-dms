# Household Digital Definition V1

## Source

- Source questionnaire: `C:\app\ses-dms-research\questionaires\20220525-TLR-Census-and-DMS-Survey_Households.docx`
- Digital definition: `household-20220525-v1`
- Mobile version code: `INITIAL`

## Question Code Convention

Codes use stable semantic paths and are not tied to paper page numbers or row numbers.

Examples:

- `household.respondent.first_name`
- `household.head.first_name`
- `household.members.birth_date`
- `household.structure.owns_occupied_structure`
- `household.project_awareness.aware`

Repeat member responses are scoped by `repeatInstanceId`, not by row number.

## Implemented Sections

| Section | Source | Notes |
| --- | --- | --- |
| Interview Record | Part I | Includes enumerator/date/time and structure tags. |
| Respondent Details | Part I | Includes respondent identity and relationship to household head. |
| Household Head / Spouse | Part I | Includes basic head and spouse identity fields. |
| Household Members | Part II | Repeat group, paper row count not enforced. |
| Structure / Occupancy | Part VI | Implements ownership, occupancy arrangement, and rent branching. |
| Project Awareness | Part IX | Implements awareness/source branching plus feedback text fields. |

## Household Members Repeat Group

Group code: `household.members`

Included fields:

- first name
- middle name
- last name
- maiden name
- relationship to household head
- civil status
- birth date
- age
- sex/gender
- highest educational attainment
- employment status
- work location
- primary occupation
- monthly income
- vulnerabilities
- religious affiliation
- ethnicity

Phase 6B stores members as repeat instances and responses only. Future phases may link them to normalized `Person` and `HouseholdMembership` records.

## Branching

Implemented source-supported branching:

- `household.project_awareness.aware = YES` shows `household.project_awareness.source`
- `household.structure.owns_occupied_structure = NO` shows `household.structure.occupancy_arrangement`
- `household.structure.occupancy_arrangement = TENANT_RENTER` shows `household.structure.tenant_rent_paid`

## Requiredness

The definition marks a narrow set of fields required to prove the renderer contract:

- interview enumerator and survey date
- respondent first/last name and relationship to head
- household head first/last name
- structure ownership answer
- project awareness answer
- conditional source/rent/occupancy fields when their branch applies
- household member first/last name and relationship, per member repeat row

Other paper fields remain optional or unresolved in Phase 6B.

## Option Sources

Household V1 uses inline questionnaire-version-specific options for conflicting classifications such as relationship, civil status, employment status, vulnerabilities, and occupancy arrangement.

These values are intentionally not normalized to canonical reporting categories yet.

## Deferred Household Content

The following source sections are intentionally deferred:

- full household expenditure matrix
- assets and debt
- access to utilities/services and government programs
- associated structures
- affected land details
- trees/crops
- livelihood and living survey
- financial institution membership
- savings/income/expenditure brackets
- relocation
- certification/signatures

## Known Ambiguities

- Whether household head/spouse must also be repeated as members.
- Whether education should become a controlled lookup.
- How employment and civil status options map to executive-summary categories.
- Whether member rows should create normalized `Person` records immediately.
- How signature/certification should map to digital workflow.
