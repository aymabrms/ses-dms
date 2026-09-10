# Phase 6G Cross-Module Triggers

## Summary

Phase 6G adds safe, definition-driven module recommendations and lightweight warning validation. It does not automatically create modules or overwrite source answers.

## Trigger Model

Question definitions can include `moduleTriggers` with:

- target module type
- outcome: `REQUIRED`, `RECOMMENDED`, `OPTIONAL`, `NOT_APPLICABLE`
- message
- source value that activates the trigger

The runtime evaluates triggers from saved responses and reports recommendations to the generic `QuestionnaireScreen`.

## Source-Backed Triggers

Implemented triggers:

- Household associated structure used for business = `YES` recommends a Business module.
- Landowner business exists on land = `YES` recommends a Business module.

If the target module already exists for the interview, the UI offers to open it. If it does not exist, the UI offers to add it. There is no automatic module creation.

## Validation Warnings

Generic lightweight warnings were added for:

- birthdate vs age mismatch, based on sibling `.birth_date` and `.age` question codes
- Business captured male/female employee totals vs employee repeat-row gender counts

Warnings never overwrite captured source responses.

## Explicit Add Module

The questionnaire screen creates a recommended module only when the enumerator presses the add button. It uses the existing local module creation path and the existing questionnaire version rows.

## Deferred

- full rules engine
- automatic module creation
- trigger severity final policy
- cross-entity validation beyond available local relationships
- source answer correction or auto-derivation
