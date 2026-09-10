# Phase 6 Source Coverage

## Household

| Source Area | Status | Reason |
| --- | --- | --- |
| Interview Record | IMPLEMENTED | Captured in bundled Household definition. |
| Respondent Details | IMPLEMENTED | Identity/contact/relationship fields included. |
| Household Head / Spouse | IMPLEMENTED | Core identity fields included. |
| Household Members | IMPLEMENTED | Repeat group with unlimited rows. |
| Expenditure | IMPLEMENTED | Category/frequency matrix captured as responses. |
| Assets / Debt | IMPLEMENTED | Asset counts and debt branch captured. |
| Utilities / Services / Programs | IMPLEMENTED | Captured as response-only fields where needed. |
| Structure / Occupancy | IMPLEMENTED | Ownership and rent branching captured. |
| Associated Structures | IMPLEMENTED | Repeat group with Business recommendation trigger. |
| Land | IMPLEMENTED | Ownership/use/rent fields captured. |
| Trees / Crops | PARTIALLY_IMPLEMENTED | Repeat items captured; final species/valuation taxonomy deferred. |
| Livelihood / Financial / Relocation | IMPLEMENTED | Captured as source-specific responses. |
| Project Awareness / Feedback | IMPLEMENTED | Awareness branching plus repeat feedback groups. |
| Certification | PARTIALLY_IMPLEMENTED | Metadata/statements captured; signature/media deferred. |

## Business

| Source Area | Status | Reason |
| --- | --- | --- |
| Interview Record | IMPLEMENTED | Captured in bundled Business definition. |
| Respondent Details | IMPLEMENTED | Identity/contact/relationship fields included. |
| Business Owner Details | IMPLEMENTED | Identity/contact/civil status included. |
| Business Profile | IMPLEMENTED | Name, nature, ownership, permits, start, income, expenditure. |
| Employee Profile | IMPLEMENTED | Repeat group with unlimited rows. |
| Employee Totals | IMPLEMENTED | Manual male/female totals preserved; warning validation added. |
| Employee Salary | IMPLEMENTED | Amount and frequency remain separate. |
| Employee Skills | IMPLEMENTED | Current/preferred trade-skill lists captured. |
| Structure / Occupancy | IMPLEMENTED | Ownership/rent branching captured. |
| Land / Ownership | IMPLEMENTED | Ownership/proof/consent/rental branching captured. |
| Owner Livelihood | IMPLEMENTED | Assistance, skills, location, training captured. |
| Employee Livelihood | IMPLEMENTED | Separate employee-subject fields captured. |
| Project Awareness / Feedback | IMPLEMENTED | Awareness branching plus repeat feedback groups. |
| Certification | PARTIALLY_IMPLEMENTED | Metadata/statements captured; signature/media deferred. |

## Landowner

| Source Area | Status | Reason |
| --- | --- | --- |
| Interview Record | IMPLEMENTED | Captured in bundled Landowner definition. |
| Respondent Details | IMPLEMENTED | Identity/contact/relationship/ID fields included. |
| Landowner Details | IMPLEMENTED | Identity/contact/occupation/address included. |
| Spouse Details | IMPLEMENTED | Name fields included. |
| Affected Land | IMPLEMENTED | Occupancy, ownership, area, use, proof, acquisition, tax, mortgage. |
| Structures on Land | IMPLEMENTED | Structure presence, household occupancy, use. |
| Business Presence | IMPLEMENTED | Business existence/ownership/kind plus Business recommendation trigger. |
| Rental / Tenancy | IMPLEMENTED | Land/structure rent and tenant payment questions captured. |
| Trees / Crops | PARTIALLY_IMPLEMENTED | Source fields captured; species/count/valuation inventory deferred. |
| Project Awareness / Feedback | IMPLEMENTED | Awareness branching plus repeat feedback groups. |
| Certification | PARTIALLY_IMPLEMENTED | Metadata/statements captured; signature/media deferred. |

## Cross-Cutting Deferred Items

- drawn signatures and media capture
- final taxonomy normalization
- financial conversion formulas
- automatic module creation
- respondent prefill/confirmation
- delete/tombstone synchronization
- production review workflow
