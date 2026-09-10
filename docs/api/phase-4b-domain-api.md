# Phase 4B Domain API

Phase 4B exposes API endpoints for the core Household, Business, Land, Structure, and relationship records already present in the Phase 3C schema. It does not implement authentication, mobile sync, questionnaire response storage, reporting, financial records, tenancy/rent, project awareness, or validation workflow.

## Endpoints

### Households

- `GET /households`
- `GET /households?projectId=<uuid>`
- `GET /households?surveyAreaId=<uuid>`
- `GET /households/:id`
- `POST /households`
- `PATCH /households/:id`
- `GET /households/:householdId/members`
- `POST /households/:householdId/members`
- `PATCH /households/:householdId/members/:membershipId`

Household creation requires `projectId` and `surveyAreaId`. The survey area must belong to the selected project. Household members are repeatable relationship records; there are no fixed member columns.

### Organizations

- `GET /organizations`
- `GET /organizations/:id`
- `POST /organizations`
- `PATCH /organizations/:id`

Organizations represent non-person owners such as corporations, partnerships, cooperatives, community organizations, or government entities. No hierarchy is implemented.

### Businesses

- `GET /businesses`
- `GET /businesses?projectId=<uuid>`
- `GET /businesses?surveyAreaId=<uuid>`
- `GET /businesses/:id`
- `POST /businesses`
- `PATCH /businesses/:id`
- `GET /businesses/:businessId/owners`
- `POST /businesses/:businessId/owners`
- `PATCH /businesses/:businessId/owners/:ownershipId`
- `GET /businesses/:businessId/employees`
- `POST /businesses/:businessId/employees`
- `PATCH /businesses/:businessId/employees/:employeeId`

Business records expose only fields in the current Prisma model. Business income, expenditure, salaries, permits, and full employee profile fields remain deferred.

### Land Parcels

- `GET /land-parcels`
- `GET /land-parcels?projectId=<uuid>`
- `GET /land-parcels?surveyAreaId=<uuid>`
- `GET /land-parcels/:id`
- `POST /land-parcels`
- `PATCH /land-parcels/:id`
- `GET /land-parcels/:landParcelId/owners`
- `POST /land-parcels/:landParcelId/owners`
- `PATCH /land-parcels/:landParcelId/owners/:ownershipId`

Land parcels do not assume cadastral identifiers or unique land tags.

### Structures

- `GET /structures`
- `GET /structures?projectId=<uuid>`
- `GET /structures?surveyAreaId=<uuid>`
- `GET /structures?landParcelId=<uuid>`
- `GET /structures/:id`
- `POST /structures`
- `PATCH /structures/:id`
- `GET /structures/:structureId/tags`
- `POST /structures/:structureId/tags`
- `PATCH /structures/:structureId/tags/:tagId`
- `GET /structures/:structureId/associations`
- `POST /structures/:structureId/associations`
- `GET /structures/:structureId/occupancies`
- `POST /structures/:structureId/occupancies`
- `PATCH /structures/:structureId/occupancies/:occupancyId`

Structures use internal UUIDs. Structure tags are external/captured identifiers and are not globally unique.

## Relationship semantics

- Household membership links `Household` and `Person`.
- Business ownership links `Business` to exactly one `Person` or one `Organization` per ownership record.
- Business employee links `Business` and `Person`.
- Land ownership links `LandParcel` to exactly one `Person` or one `Organization` per ownership record.
- Structure tags belong to one structure and inherit the structure project context.
- Structure associations link parent/main structures to child/associated structures.
- Structure occupancy links a structure to exactly one household, business, or person occupant.

Ownership, employment, membership, occupancy, and structure association remain separate relationship types.

## Validation rules

- Project/survey-area records are checked for existence and project consistency.
- Household membership requires an existing person.
- Household relationship lookup values, if provided, must belong to `HOUSEHOLD_RELATIONSHIP`.
- Duplicate household/person membership is rejected at the application layer.
- Business ownership requires exactly one of `personId` or `organizationId`.
- Business employee requires an existing person.
- Duplicate business/person employee relationship is rejected at the application layer.
- Land ownership requires exactly one of `personId` or `organizationId`.
- Structure land links reject land parcels from another project.
- Structure tags reject exact duplicate `structureId/tagValue/sourceRaw` combinations but do not enforce global tag uniqueness.
- Structure associations reject self-association and duplicate parent-child pairs.
- Structure associations require both structures to belong to the same project.
- Structure occupancy requires exactly one of `householdId`, `businessId`, or `personId`.
- Structure occupancy rejects cross-project household/business occupants.
- `startedAt` must be before or equal to `endedAt` when both are supplied.
- Interview module context validation now rejects clear module/context mismatches while still allowing optional `structureId` context.

## Duplicate prevention strategy

Phase 4B uses application-level duplicate checks only where the business meaning is safe:

- Household/person membership.
- Business/person employee relationship.
- Structure tag on the same structure with the same source.
- Parent-child structure association.

No new unique database constraints were added in Phase 4B.

## Ownership and occupancy XOR rules

The Phase 3C PostgreSQL `CHECK` constraints remain authoritative for persistence. Phase 4B also validates these rules before insert/update to return clear `400 Bad Request` responses:

- Business ownership: exactly one owner type.
- Land ownership: exactly one owner type.
- Structure occupancy: exactly one occupant type.

## Known limitations

- No DELETE endpoints.
- No pagination.
- No tenancy or rent records.
- No financial records.
- No full lookup taxonomy normalization.
- No automatic module branching.
- No household-head uniqueness rule.
- Person occupants of structures are not project-scoped because `Person` is a shared identity anchor.
- No recursive structure tree logic.

## Deferred behavior

- Tenancy/rent.
- Income, expense, salary, and savings.
- Project awareness and feedback.
- Questionnaire response storage.
- Offline/mobile synchronization.
- Review/validation workflow.
- Reporting/dashboard queries.
