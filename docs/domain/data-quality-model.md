# Data Quality Model

The questionnaires are paper instruments with optional, conditional, repeated, and free-text fields. A blank value alone cannot explain whether a field was skipped correctly, refused, forgotten, not encoded, or requires review. The system needs explicit response/data-quality states.

## Response states

| State | Meaning | Example from questionnaires | Reporting implication |
| --- | --- | --- | --- |
| Answered | A valid response was provided according to the field type and context. | Project awareness = Yes; business monthly income entered; household member gender selected. | Included in normal counts and summaries. |
| No Response | Respondent did not provide an answer or refused/declined. | Executive summary includes `No Response` in age and income categories. | Count separately from missing and not applicable. |
| Not Applicable | Field does not apply because of another answer or domain context. | Land ownership proof when business does not own land; rent amount when occupancy is rent-free. | Exclude from denominator when appropriate. |
| Unknown | The answer is not known at collection time. | Respondent cannot state proof, exact age, source, or ownership detail. | May be reportable separately or require follow-up depending severity. |
| Missing | The field should have been answered but no response state was recorded. | Awareness Yes but source of awareness blank; rented quarters Yes but monthly rate blank. | Requires validation or correction. |
| Requires Validation | Captured value exists but appears inconsistent, incomplete, or conflicts with other data. | Age does not match birthdate; employee gender totals do not match employee rows; structure used for business but no business module exists. | Must be reviewed before validation/finalization. |

## Why NULL alone is insufficient

- A blank `rent amount` can mean rent-free, not applicable, respondent did not answer, enumerator missed the field, or encoder omitted it.
- A blank `source of project awareness` is valid if awareness is No, but problematic if awareness is Yes.
- A blank household member income can mean unemployed, too young/old to work, no response, or missing.
- Executive-summary categories include `No Response`, proving that no-response values must remain reportable rather than disappearing as nulls.

## Validation severity

| Severity | Meaning | Example | Expected action |
| --- | --- | --- | --- |
| Information | Not an error; useful review note. | Respondent and household head are different people. | Display note or audit detail. |
| Warning | Possible issue that may still allow submission. | Household member has age but no birthdate; tenant count present without detailed tenant names where source lacks detail. | Reviewer may accept or return. |
| Error | Data is inconsistent or required answer is missing for the current branch. | Project awareness Yes with no source; rented structure with no rent amount. | Should be corrected or explicitly marked No Response/Unknown. |
| Blocking Error | Submission cannot proceed because required structural data is absent. | No respondent; no interview date; no questionnaire version; no household member records for Household module if required. | Prevent ready-to-sync or validation until resolved. |

## Conceptual validation examples

- Birthdate and age consistency can be checked against survey date.
- Employee male/female totals can be compared with employee rows.
- Rent amounts can be required only when rent applies.
- Business module linkage can be flagged when associated structure business use is Yes.
- Ownership proof can be required or marked No Response/Unknown when ownership is Yes.
- Household head/member reporting counts must flag possible duplication until domain rules are confirmed.

## Implementation note

This model is conceptual only. It does not define code, database columns, validation functions, or Prisma models.
