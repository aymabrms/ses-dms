# Branching Rules

This document records branching rules evident from the source questionnaires. It does not invent additional rules.

## A. Simple conditional fields

| Rule | Source | Consequence | Notes |
| --- | --- | --- | --- |
| If project awareness is Yes, capture where respondent learned about the project. | Household Part IX, Business Part VI, Landowner project awareness | Source-of-awareness applies only when aware. | Source does not say whether source is Not Applicable or Missing if awareness is No. |
| If household has access to power or water, indicate supplier. | Household Part V | Supplier field applies. | `None` option appears for power and water. |
| If household uses public transportation, common trip purpose applies. | Household Part V | Trip purpose choices apply. | Source does not explicitly say trip purpose is skipped when No. |
| If household has debt, amount and source apply. | Household Part IV | Debt amount and debt source apply. | Need whether debt is household-level only. |
| If household was relocated in the past, state reason. | Household Part VIII | Reason applies. | Source captures Yes reason or No. |
| If household availed government housing programs, state program. | Household Part VIII | Program name applies. | Distinct from access to government programs. |
| If respondent is not primary resident, state primary place of residence. | Household Part VIII | Primary residence text applies. | Wording: `Is your house your primary residence? Yes No...`. |
| If business has permits/licenses, permit/license answer is Yes. | Business Part II | No follow-up details in source. | Details may be required later but not in source. |
| If employees' quarters are rented, monthly rate per employee applies. | Business Employees' Profile | Rate applies. | Distinct from business land/structure rent. |
| If business does not own occupied structure, occupancy arrangement applies. | Business Part III | Tenant/renter rate, rent-free, or other applies. | If tenant/renter, monthly rate is captured. |
| If business owns land, proof of ownership applies. | Business Part III | Proof applies. | If no, consent and rental questions apply. |
| If business does not own land, landowner consent applies. | Business Part III | Consent Yes/No applies. | If consent Yes, rental fee question applies. |
| If land rental fee applies, amount applies. | Business Part III; Household Part VII; Landowner affected land details | Rent amount applies. | Rent context differs by questionnaire. |
| If land has trees/crops, planted items and planter apply. | Household Part VII; Landowner affected land details | Tree/crop details apply. | Source does not require structured crop rows. |
| If landowner/others did not plant trees/crops and paid for planting, payment/proceeds details apply. | Household Part VII; Landowner affected land details | Payment mode or sharing/proceeds applies. | Household asks mode of payment; Landowner asks arrangement/sharing of proceeds/profit. |
| If tenants exist on land, pay-for-use question applies. | Landowner affected land details | Tenant rent/payment question applies. | No tenant identity fields in Landowner source. |

## B. Role/module branching

| Rule | Source evidence | Consequence | Ambiguity |
| --- | --- | --- | --- |
| If an associated structure is used for business purposes, answer Business Questionnaire. | Household Part VI associated structure table states `Yes (ANSWER BUSINESS QUESTIONNAIRE)`. | Business module/interview may be required. | Need whether this creates a linked Business Questionnaire for same interview, a separate interview, or both. |
| If there is a business on land owned by landowner, determine whether landowner owns that business. | Landowner affected land details asks if business exists and if landowner owns it. | Business domain linkage may be required. | Source does not explicitly say to complete Business Questionnaire. |
| If respondent is not the household head, household head details still apply. | Household Part I includes respondent relationship and separate household head details. | Respondent and household head are separate concepts. | Need whether household head must also be listed as member. |
| If respondent is not business owner, business owner details still apply. | Business Part I includes respondent relationship and separate business owner details. | Respondent and business owner are separate concepts. | Need whether multiple business owners are captured. |
| If respondent is not landowner, landowner details still apply. | Landowner Part I includes respondent relationship and separate landowner details. | Respondent and landowner are separate concepts. | Need whether legal representative/proxy rules exist. |
| Preference for livelihood restoration in Landowner is for `LO with Business`. | Landowner project awareness section | Livelihood restoration may apply conditionally to landowners with business. | Need whether landowners without business skip this item. |

## C. Repeatable-record branching

| Rule | Source | Consequence | Ambiguity |
| --- | --- | --- | --- |
| Add household member records for each household member. | Household Part II table | Repeat household member rows. | Printed rows are not the limit. |
| Add business employee records for each employee. | Business Employees' Profile plus `use separate sheet if needed` | Repeat employee rows and compute male/female totals. | Need whether owner is included as employee. |
| Add associated structure records if associated structures exist. | Household Part VI | Repeat associated-structure rows. | Need max/ownership rule. |
| Add renter/tenant records if household rents out structure. | Household Part VI | Repeat renter/tenant details. | Landowner does not provide tenant details. |
| Add issues, recommendations, benefits, and livelihood preference items as needed. | All final sections | Repeat free-text response records. | Four printed slots may not be a business limit. |

## D. Cross-field validation

| Rule | Source evidence | Validation idea | Ambiguity |
| --- | --- | --- | --- |
| Birthdate and age should be consistent. | Respondent, household head, spouse, business owner, household members, employees, landowner | Warning or error if age differs from birthdate and survey date. | Source does not state tolerance. |
| Employee total male/female should match employee rows by gender. | Business Employees' Profile | Warning if totals do not match repeated employee records. | Source allows manual totals; system can calculate but need whether to store respondent-stated total. |
| Household size should match household member rows. | Household members and executive summary requirements | Warning/error if reported size differs from rows if separate size field exists later. | Source questionnaire does not show explicit household size field. |
| Employment details should align with employment status. | Household member employment status and occupation/income fields | If unemployed/too young/old, occupation and income may be Not Applicable or require validation. | Source does not define exact rules. |
| Rent amount should be present when tenant/renter or rental fee applies. | Household, Business, Landowner rent questions | Missing rent amount requires validation. | Rent-free means amount is Not Applicable. |
| Ownership proof should be present when land is owned. | Business and Household/Landowner land sections | Missing proof requires validation. | Need accepted proof categories. |

## E. Cross-entity validation

| Rule | Source evidence | Validation idea | Ambiguity |
| --- | --- | --- | --- |
| A structure used for business should link to a business module. | Household associated structure business-use flag | Business module expected or explicit exception required. | Need workflow rule for same household vs separate business respondent. |
| Land containing structures should link land and structure records. | Landowner asks if structure is on land; Household/Business use structure tags | Structure should reference land when known. | Parcel and structure identity rules are undefined. |
| Business located on land should have land occupancy or land ownership context. | Business Part III; Landowner business-on-land questions | Link business to land/structure occupancy. | Need whether business can occupy multiple structures/parcels. |
| Tenants listed by structure owner may require household/business interviews. | Household renters/tenants; Landowner tenants | Tenant records may create subjects/interviews. | Source does not instruct follow-up. |
| A single person may appear as respondent, owner, member, employee, or tenant. | All questionnaires collect names for different roles | Potential duplicate-person review, not automatic merge. | No deterministic identity rule in source. |
