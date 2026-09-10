# Business Digital Definition V1

## Source

- Source questionnaire: `C:\app\ses-dms-research\questionaires\20220525-TLR-Census-and-DMS-Survey_Business.pdf`
- Digital definition: `business-20220525-v1`
- Mobile version code: `INITIAL`

## Question Code Strategy

Business codes use stable semantic paths and avoid paper page or row numbers.

Examples:

- `business.interview.survey_date`
- `business.respondent.first_name`
- `business.owner.first_name`
- `business.profile.name`
- `business.employees.salary_amount`
- `business.structure.owns_structure`
- `business.land.owns_land`
- `business.project_awareness.aware`

Repeat employee and feedback responses are scoped by `repeatInstanceId`.

## Implemented Sections

| Section | Source | Notes |
| --- | --- | --- |
| Interview Record | Part I | Enumerator, survey date/time, barangay, structure tag. |
| Respondent Details | Part I | Identity, relationship to business owner, contact, valid ID. |
| Business Owner Details | Part I | Identity, demographics, civil status, contact. |
| Business Profile | Part II | Name, nature, ownership type, permits, start date, operation length, income, expenditure. |
| Employee Profile | Part II | Repeat group `business.employees`; printed rows are not a maximum. |
| Employee Totals and Quarters | Part II | Manual male/female totals plus rented-quarter rate. |
| Employee Skills | Part II | Current and preferred trade-skill lists. |
| Structure / Occupancy | Part III | Structure type, ownership, occupancy arrangement, rent. |
| Land / Ownership | Part III | Land ownership, proof, consent, rental fee, amount. |
| Owner Livelihood Rehabilitation | Part IV | Assistance, current skills, preferred location, preferred training. |
| Employee Livelihood Rehabilitation | Part V | Separate employee-subject livelihood questions. |
| Project Awareness | Part VI | Awareness and source branching. |
| Project Feedback | Part VI | Repeat groups for issues, recommendations, benefits, livelihood preferences. |
| Certification Metadata | Final block | Certification statements and names/dates only; no signature capture. |

## Employee Repeat Group

Group code: `business.employees`

Included fields:

- source worker name
- optional first/last name split for usable encoding
- gender
- civil status
- employment status
- age
- work assignment
- salary amount
- salary frequency
- educational attainment
- residence
- sleeping quarters
- financial institution membership

The source captures `Name of worker` as one table field. The definition preserves that source field as `business.employees.name` and adds optional split name fields without automatically creating or merging `Person` records.

## Salary Handling

Salary amount and salary frequency are separate fields:

- `business.employees.salary_amount`
- `business.employees.salary_frequency`

No daily/weekly/monthly conversion is performed in Phase 6D.

## Branching

Implemented source-supported branching:

- `business.structure.owns_structure = NO` shows occupancy arrangement.
- `business.structure.occupancy_arrangement = TENANT_RENTER` shows monthly rent.
- `business.land.owns_land = YES` shows proof of ownership.
- `business.land.owns_land = NO` shows landowner consent.
- `business.land.landowner_consent = YES` shows rental-fee question.
- `business.land.pays_rental_fee = YES` shows land rental amount.
- `business.project_awareness.aware = YES` shows source of awareness.
- `business.employees.quarters_rented = YES` shows monthly quarter rate per employee.

Hidden required fields do not count as missing.

## Classification Ambiguities

The following remain source-specific and are not normalized:

- business ownership type
- employee employment status
- civil status
- educational attainment
- trade skills
- vocational/training sectors
- salary frequency
- structure type/occupancy
- land ownership proof/consent/rent context

## Domain And Reporting Metadata

Mapping metadata is included where useful for Business, BusinessEmployee, Person, income/expenditure, employee salary, structure, and land contexts. The metadata does not perform normalization or reporting SQL.

## Deferred

- drawn signatures/media capture
- automatic Person creation from employee rows
- automatic employee total derivation
- salary frequency conversion
- final taxonomy normalization
- cross-module auto-creation
- backend-driven questionnaire definitions
- Landowner questionnaire
