# Phase 4A Core API

Phase 4A adds the first backend API foundation around the stable Phase 3C domain backbone. It does not implement authentication, user permissions, questionnaire screens, synchronization, reporting, financial records, tenancy, project awareness, validation workflow, or full questionnaire response storage.

## Endpoints created

### Projects

- `GET /projects`
- `GET /projects/:id`
- `POST /projects`
- `PATCH /projects/:id`

Create fields:

- `code`: required string.
- `name`: required string.
- `description`: optional string.

### Survey Areas

- `GET /survey-areas`
- `GET /survey-areas?projectId=<uuid>`
- `GET /survey-areas/:id`
- `POST /survey-areas`
- `PATCH /survey-areas/:id`

Create fields:

- `projectId`: required UUID.
- `name`: required string.
- `code`: optional string.

Creation verifies that the referenced project exists.

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`

This is administrative account/profile metadata only. It is not authentication.

Create fields:

- `email`: required valid email.
- `displayName`: required string.
- `status`: optional `ACTIVE` or `INACTIVE`.

No passwords, login, JWT, sessions, or RBAC are implemented.

### Questionnaire Versions

- `GET /questionnaire-versions`
- `GET /questionnaire-versions/:id`
- `GET /questionnaire-versions?moduleType=HOUSEHOLD`
- `GET /questionnaire-versions?projectId=<uuid>`
- `GET /questionnaire-versions?isActive=true`

Questionnaire versions are read-only in Phase 4A. The seeded `HOUSEHOLD`, `BUSINESS`, and `LANDOWNER` `INITIAL` versions are readable.

### Persons

- `GET /persons/:id`
- `POST /persons`
- `PATCH /persons/:id`

Supported fields:

- `firstName`
- `middleName`
- `lastName`
- `maidenName`
- `birthDate`
- `genderRaw`
- `primaryContactNumber`
- `primaryEmail`

No global search, fuzzy matching, deduplication, merge workflow, or automatic `PersonIdentityObservation` creation is implemented.

### Interviews

- `GET /interviews`
- `GET /interviews?projectId=<uuid>`
- `GET /interviews?surveyAreaId=<uuid>`
- `GET /interviews?enumeratorUserId=<uuid>`
- `GET /interviews?status=DRAFT`
- `GET /interviews/:id`
- `POST /interviews`
- `PATCH /interviews/:id`

Create fields:

- `projectId`: required UUID.
- `surveyAreaId`: required UUID.
- `enumeratorUserId`: required UUID.
- `respondentPersonId`: optional UUID.
- `surveyDate`: required ISO date-time.
- `startedAt`: required ISO date-time.

Creation verifies that the project, survey area, enumerator user, and optional respondent person exist. It also verifies that the survey area belongs to the selected project.

### Interview Modules

- `GET /interviews/:interviewId/modules`
- `POST /interviews/:interviewId/modules`

Create fields:

- `questionnaireVersionId`: required UUID.
- `moduleType`: required `HOUSEHOLD`, `BUSINESS`, or `LANDOWNER`.
- `householdId`: optional UUID.
- `businessId`: optional UUID.
- `landParcelId`: optional UUID.
- `structureId`: optional UUID.
- `status`: optional module status.

Creation verifies that the interview exists, the questionnaire version exists, and the requested module type matches the questionnaire version module type. Optional context IDs are checked if provided, but Phase 4A does not fully enforce module/context combinations.

## Validation behavior

The API uses a global NestJS `ValidationPipe` with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Unknown request fields are rejected. UUID route params and DTO UUID fields are validated. Email fields and ISO date-time fields are validated.

`class-validator` and `class-transformer` were added specifically to support NestJS DTO validation.

## Domain checks

- Survey area creation requires an existing project.
- Interview creation requires existing project, survey area, enumerator user, and optional respondent person.
- Interview creation rejects survey areas that do not belong to the selected project.
- Interview module creation requires an existing questionnaire version.
- Interview module creation rejects mismatched module type and questionnaire version module type.
- Interview module creation validates optional context IDs if provided.
- Project code and user email uniqueness errors are translated to conflict responses.

## Deferred APIs

- Household CRUD.
- Household membership CRUD.
- Business CRUD.
- Land parcel CRUD.
- Structure CRUD.
- Ownership APIs.
- Person identity observation APIs.
- Questionnaire response engine.
- Survey submission/review/validation workflow.
- Synchronization.
- Reporting/dashboard.
- Financial, rent, expense, income, and tenancy APIs.

## Known limitations

- There is no authentication or authorization; `User` is profile/account metadata only.
- Interview status transitions are not finalized or enforced as a workflow.
- Interview module context combinations are not fully enforced beyond existence checks.
- No automatic module triggering exists.
- No automatic person matching, deduplication, or merge workflow exists.
- No pagination is implemented yet.

## Example request flow

1. Create Project with `POST /projects`.
2. Create Survey Area with `POST /survey-areas` using the project ID.
3. Create User/Enumerator with `POST /users`.
4. Create Person/Respondent with `POST /persons`.
5. Create Interview with `POST /interviews` using the project, survey area, user, and respondent IDs.
6. Attach module with `POST /interviews/:interviewId/modules` using one seeded questionnaire-version ID.
7. Fetch the interview with `GET /interviews/:id`.
