# Open Questions

This document records unresolved business and design decisions. They must be reviewed before database migrations or questionnaire implementation.

1. What are the authoritative questionnaire versions, full field lists, option lists, and conditional rules?
2. When does a household head appear in the household-member list, and how must household and population totals be calculated?
3. What process identifies a person across roles without automatically merging distinct people with similar details?
4. Which roles may assign, return, validate, finalize, reopen, or reassign a survey?
5. How should offline edits be handled after a submitted survey is returned for correction or reassigned?
6. Are GPS points, photographs, signatures, scanned IDs, or other attachments required?
7. What data retention, consent, encryption, access, and device-loss policies apply to sensitive respondent data?
8. Which reference lists are controlled, who maintains them, and are they project-specific?
9. What reports, calculations, denominator rules, and export formats are required for acceptance?
10. Does legacy Excel data require import, and what data-quality remediation is expected before import?
