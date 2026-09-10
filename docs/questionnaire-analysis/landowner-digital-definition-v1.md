# Landowner Digital Definition V1

## Source

- Source questionnaire: `C:\app\ses-dms-research\questionaires\20220525-TLR-Census-for-Landowners.docx`
- Digital definition: `landowner-20220525-v1`
- Mobile version code: `INITIAL`

## Implemented Sections

| Section | Status | Notes |
| --- | --- | --- |
| Interview Record | Implemented | Enumerator, survey date/time, barangay. |
| Respondent Details | Implemented | Identity, relationship to landowner, contact, valid ID. |
| Landowner Details | Implemented | Identity, occupation, contact, barangay address. |
| Landowner Spouse Details | Implemented | Name components only, as shown in source. |
| Affected Land | Implemented | Occupancy, ownership type, area, use, proof, acquisition, tax, mortgage. |
| Structures on Land | Implemented | Structure presence, household occupancy, use. |
| Business Presence | Implemented | Business exists, landowner ownership, kind/nature. |
| Rental / Tenancy | Implemented | Land/structure rent and tenant payment questions. |
| Trees and Crops | Implemented | Presence, planter, remarks, planting payment, proceeds/profit sharing. |
| Project Awareness | Implemented | Awareness and source branching. |
| Project Feedback | Implemented | Repeat groups for issues, recommendations, benefits, livelihood preferences. |
| Certification Metadata | Implemented | Statements and names/dates only; no signature capture. |

## Branching

- `landowner.structure.exists = YES` shows structure details.
- `landowner.business.exists_on_land = YES` shows business ownership/type questions.
- `landowner.rent.land_rented_out = YES` shows land rental amount.
- `landowner.rent.structure_rented_out = YES` shows structure rental amount.
- `landowner.trees_crops.exists = YES` shows planter/payment detail fields.
- `landowner.tenants.exists = YES` shows tenant payment question.
- `landowner.project_awareness.aware = YES` shows awareness source.

## Repeat Groups

The source uses fixed numbered feedback blanks; the definition treats these as repeat groups:

- `landowner.feedback.issues`
- `landowner.feedback.recommendations`
- `landowner.feedback.benefits`
- `landowner.feedback.livelihood_preferences`

Tenant identity and detailed crop inventories are not repeated because the source does not capture row-level tenant or species/count details.

## Deferred Or Unresolved

- drawn signatures/media capture
- tenant identity repeat records
- normalized tree/crop species inventory
- automatic Business module creation from business presence
- final land/structure/business taxonomy normalization
