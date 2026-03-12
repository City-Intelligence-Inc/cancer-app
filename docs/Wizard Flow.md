# Wizard Flow

6 steps, then results.

```
age → role → location → diagnosis → treatment-stage → help-needed → results
```

## Steps

| Step | Question | Input Type | Stored As |
|------|----------|-----------|-----------|
| 1. Age | "How old are you?" | Number input | `answers.age` |
| 2. Role | "Are you a patient or carer?" | Single select (Patient / Carer) | `answers.role` |
| 3. Location | "Where are you based?" | City autocomplete with dropdown | `answers.location` + `answers.country` |
| 4. Diagnosis | "What type of cancer?" | Single select (dynamic from sheet) | `answers.diagnosis` |
| 5. Treatment Stage | "What stage of treatment?" | Single select | `answers.treatment_stage` |
| 6. Help Needed | "What kind of help?" | Multi-select chips | `answers.help_needed[]` |

## Key Implementation Details

- **Location autocomplete** pulls cities from both Google Sheet AND DynamoDB resources
- **Diagnosis options** are fetched dynamically from the sheet's `Cancer Type` column (not hardcoded)
- **Help types** derived from the `HELP_TYPES` constant in `data/resources.ts`
- Each step saves answers to the session via `PUT /sessions/{id}`
- Progress bar shows current step / total steps

## Files

| Platform | Path |
|----------|------|
| Mobile | `frontend/app/wizard/*.tsx` |
| Web | `web/src/app/wizard/*/page.tsx` |
| Layout | `frontend/app/wizard/_layout.tsx` / `web/src/app/wizard/layout.tsx` |
