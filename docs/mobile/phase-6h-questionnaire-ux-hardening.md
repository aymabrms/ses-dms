# Phase 6H Questionnaire UX Hardening

## Summary

Phase 6H improves field-testing usability without introducing a new design system or module-specific form implementations.

## Improvements

- The questionnaire screen uses keyboard-aware wrapping and `keyboardShouldPersistTaps` to keep long forms usable during editing.
- Local save state is labeled as local-only and does not imply sync completion.
- Section tabs show simple status labels: `Not Started`, `In Progress`, `Missing`, `Warning`, or `Blocked`.
- Overall completion, required-missing count, warnings, and save state remain visible above sections.
- Repeat groups continue to support add, sequence numbering, and local-only removal; synced repeat deletion remains blocked until tombstone sync exists.
- Text inputs use better keyboard types for numeric/money fields, phone/contact fields, and email fields.

## Constraints Preserved

- Household, Business, and Landowner still use the same generic `QuestionnaireScreen`.
- No UI framework or design system was added.
- No delete/tombstone sync was added.
- No module-specific completion logic was introduced.

## Deferred

- polished tablet layout
- full component test suite
- collapsible repeat-row editing
- advanced accessibility audit
