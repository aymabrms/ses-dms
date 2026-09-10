# Shared vs Specific Questionnaire Analysis

## Comparison matrix

| Area | Household Questionnaire | Business Questionnaire | Landowner Questionnaire | Analysis |
| --- | --- | --- | --- | --- |
| Interview record | Enumerator, survey date, start, finish, barangay | Same fields | Same fields | Same wording and reusable interview module. |
| Introductory statement | Arup/DOTr SES and DMS wording | Arup/DOTr SES and DMS wording | DOT Land Ownership Survey wording | Same project context, but Landowner is framed as Land Ownership Survey. |
| Respondent name | Last, first, middle, maiden | Last, first, middle, maiden | Last, first, middle, maiden | Same concept and similar wording. |
| Respondent relationship | Relationship to household head | Relationship to business owner | Relationship to landowner | Same concept but different target and meaning. Must store target context. |
| Respondent demographics | Birthdate, age, gender | Birthdate, age, gender | Birthdate, age, gender | Same concept. |
| Respondent contact | Contact, email, valid ID | Contact, email, valid ID | Contact, email, valid ID | Same concept and candidate reusable respondent module. |
| Subject person | Household head and spouse | Business owner | Landowner and spouse | Same person-role concept but role-specific attributes differ. |
| Civil status | Household members | Business owner and employees | Not visible for landowner in extracted text | Conceptually shared but not consistently captured. |
| Household composition | Household head, spouse, repeatable household members | Not asked | Landowner relationship options mention household roles | Household-specific data, but person roles overlap with Landowner respondent relationship. |
| Business profile | Associated structures can be used for business; household income may be enterprise-based | Business name, nature, ownership, permits, start, income, expenditure | Asks if business exists on land and whether landowner owns it | Business is a shared domain. Business Questionnaire is the detailed module. |
| Employee details | Household member employment fields | Repeatable employee profile | Not asked | Employment concept is shared, but employee relationship is Business-specific. |
| Land ownership | Land occupied, ownership, proof, acquisition, tax, mortgage, area, actual use, rent, trees/crops | Own land where business is located, proof, consent, rental fee | Detailed land ownership, occupancy, use, tax, mortgage, structures, tenants | Conceptually shared, but Landowner is the detailed module. |
| Structure ownership | Main and associated structure tags, structure use/type/condition/ownership/rent/tenants | Structure tag and structure occupied by business, occupancy arrangement | Structure on land, occupied by households, use | Structure is a shared linking domain. |
| Rent | Household expense rent; renters/tenants average rent; respondent-household rent; land rent | Structure tenant/renter rate; land rental fee; employee quarters rate | Monthly rental for land and structure; tenant pay-for-use | Same word, different economic events. Needs separate rent contexts. |
| Income | Member monthly income, household head income sources, estimated household monthly income | Average monthly business income; employee salary | Landowner occupation only; no household/business income except rent/business existence | Same concept family but different unit, subject, and denominator. |
| Expenses | Household expenditure by category/frequency and monthly expenditure bracket | Average monthly business expenditures | Not asked | Household and business expenses must remain distinct. |
| Skills | Household members current/preferred skills | Employees current/preferred skills; owner and employee livelihood skill/training | Not visible except project livelihood preference for LO with business | Conceptually shared but subject differs: household group, employees, owner. |
| Financial institutions | Household membership: Pagibig, SSS, Cooperative, GSIS, Others | Per employee: Pag-IBIG, GSIS, SSS, Cooperative, PhilHealth, micro-finance, others | Not asked | Conceptually shared but different subjects and options. |
| Government programs | Household access and housing programs | Not asked | Not asked | Household-specific in reviewed sources. |
| Trees/crops | Land occupied: existence, planted items, planter, payment mode | Not asked | Land owned: trees/crops, planter, payment/proceeds sharing | Shared land concept with different ownership perspective. |
| Project awareness | Yes/No, source, issues, recommendations, benefits, livelihood preference | Same structure | Same structure | Candidate reusable module, but examples and livelihood text differ. |
| Certification | Interviewee/respondent, field interviewer, reviewer/supervisor | Same | Same | Candidate reusable review/certification module. |

## Same wording

- Interview record fields: enumerator name, survey date, time started, time finished, barangay.
- Respondent identity fields: complete name components, birthdate, age, gender, contact number, email, valid ID.
- Project awareness core: awareness Yes/No, source if yes, issues/concerns, recommendations, perceived benefits.
- Certification blocks: respondent/interviewee statement, field interviewer statement, reviewer/supervisor signature.

## Same concept but different meaning or context

- Respondent relationship targets differ by questionnaire: household head, business owner, landowner.
- Rent may be household expense, structure rental income, respondent-household rent paid, business-premises rent, land-use rent, landowner rent received, or employee-quarter rent.
- Income may be individual member income, household aggregate income, household head income source, average business income, or employee salary.
- Skills may describe household members, business employees, business owner, current skills, preferred skills, or vocational training.
- Ownership may refer to land, structure, business ownership type, or asset ownership.

## Role-specific sections

- Household-specific: household members, household expenditure categories, household assets, utilities/services, government programs, relocation history/preference, household savings/income/expenditure brackets.
- Business-specific: business profile, permits/licenses, business operation duration, employee profile, employee quarters, business owner and employee livelihood measures.
- Landowner-specific: landowner spouse, landowner occupation/address, land ownership details, structures and businesses on owned land, tenants on land, rental for land/structure from landowner perspective.

## Candidate reusable modules

- Interview record module.
- Respondent module.
- Person identity module.
- Subject role module for household head, business owner, landowner, spouse, employee, tenant.
- Land and structure module with role-specific subquestions.
- Project awareness and feedback module.
- Livelihood preference module with subject context.
- Certification and review module.

## Areas that should remain role-specific

- Household composition and household-level expenditure/assets.
- Business permits, employees, operation duration, business income/expenditure.
- Land ownership proof, acquisition, tax, mortgage, and landowner tenant/rental perspective.
- Relocation preference as captured in the Household Questionnaire unless confirmed for other modules.
