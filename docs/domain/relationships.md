# Domain Relationships

This document describes conceptual relationships and cardinality in plain English. It does not define tables, foreign keys, or ORM models.

## Identity relationships

- One `Person` may appear in many questionnaire contexts as respondent, household head, spouse, household member, business owner, employee, landowner, or tenant.
- One `Interview` has one captured respondent person or respondent identity block.
- The respondent may be the same real-world person as the household head, business owner, landowner, employee, or tenant, but the source documents do not define automatic matching rules.
- A `User` may represent a system account for a real person, but paper questionnaires only provide free-text enumerator/interviewer names.

## Role relationships

- One `Person` can have many `PersonRole` records.
- One role is meaningful only in context, such as `Household Head of Household A`, `Business Owner of Business B`, or `Tenant of Structure C`.
- A respondent role is tied to an interview, not necessarily to ownership or household membership.

## Survey/interview relationships

- One `Project` has many `SurveyArea` records.
- One `SurveyArea` can have many `Interview` records.
- One `Interview` belongs to one project context and one survey area/barangay context.
- One `Interview` has one respondent.
- One `Interview` is conducted by one enumerator/interviewer as captured on the form.
- One `Interview` uses one or more questionnaire modules: Household, Business, Landowner, or linked modules triggered by role/structure/business conditions.
- One `Interview` should reference the `QuestionnaireVersion` used for each module.

## Project assignment relationships

- One `Project` can have many assignments.
- One `SurveyArea` can have many assignments.
- One `Enumerator` or `User` can have many assignments.
- One assignment may result in zero, one, or many interviews depending on workflow rules that are not yet defined.

## Household membership relationships

- One `Household` has one household head.
- One `Household` may have one spouse of the household head.
- One `Household` has many household members.
- One `HouseholdMembership` links one person to one household and stores relationship to household head.
- A person can be a member of more than one household only if domain experts confirm edge cases such as split residence; default rules are unresolved.

## Ownership relationships

- One `LandParcel` can have one or more owners. Owners may be persons, community ownership, corporation, or another legal owner type; exact owner modeling is unresolved.
- One `Structure` can have one or more owners. Structure ownership is distinct from land ownership.
- One `Business` can have one or more owners, despite the Business Questionnaire using a singular `Business Owner Details` section.
- Ownership is not the same as occupancy. A landowner may not occupy the land. A structure owner may rent the structure out. A business owner may not own the land or structure used by the business.

## Occupancy relationships

- One `LandParcel` may be occupied by an owner, household, business, tenant, or other occupant.
- One `LandParcel` may contain many structures.
- One `Structure` may be occupied by a household.
- One `Structure` may host a business.
- One `Structure` may have tenants/renters.
- One household may occupy one main structure in the source questionnaire, but multi-structure or shared-structure cases are not defined.

## Employment relationships

- One `Business` has many employees.
- One `BusinessEmployee` record links a worker/person to a business and stores employment status, work assignment, salary, residence, quarters, and financial memberships.
- One household member may have employment details independent of a known business record.
- Household income source categories, employment status, work location, and occupation are related but not identical.

## Tenancy relationships

- One `LandParcel` can have many tenants.
- One `Structure` can have many tenants/renters.
- A tenant may be a person, household, or business; the source forms do not consistently identify tenant type.
- Rent can be paid by a tenant or received by an owner. Rent context must identify the asset and payer/payee perspective.

## Land, structure, and business relationships

- One `LandParcel` may have many `Structure` records.
- One `Structure` may be associated with one main structure as an associated structure.
- One `Business` may occupy a structure and/or land.
- One `LandParcel` may have a business on it even if the landowner does not own that business.
- A structure used for business purposes in the Household Questionnaire indicates that the Business Questionnaire may apply.

## Review and validation relationships

- One `SurveySubmission` belongs to one interview or questionnaire module submission revision.
- One `SurveySubmission` may have many `ValidationIssue` records.
- One `SurveyReview` records reviewer/supervisor action on a submission or interview.
- One interview has one current workflow status, but may have many historical review actions.
- Certification signatures in the paper source are evidence of interviewee, interviewer, and reviewer participation, but digital workflow rules remain unresolved.

## Relationship types that must not be collapsed

- Identity: whether two captured people are the same real-world person.
- Role: what capacity a person has in a specific context.
- Ownership: legal or claimed ownership of land, structure, or business.
- Occupancy: physical use or residence, with or without ownership.
- Membership: belonging to a household.
- Employment: work relationship and compensation.
- Tenancy: occupancy or use with rental/pay-for-use arrangement.
- Survey/interview: data collection event and respondent relationship.
- Review/validation: quality-control workflow after collection.
