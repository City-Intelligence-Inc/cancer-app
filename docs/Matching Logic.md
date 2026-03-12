# Matching Logic

Rule-based matching — no AI. Lives in `frontend/utils/match.ts` and `web/src/utils/match.ts`.

## 6 Filters (all must pass)

| # | Filter | Pass Condition |
|---|--------|---------------|
| 1 | **Location** | Resource covers entire country, OR user's city is in resource's cities, OR user's country matches |
| 2 | **Diagnosis** | Resource covers "All" cancer types, OR user's specific cancer type is listed |
| 3 | **Help Type** | At least one overlap between user's selected help types and resource's categories |
| 4 | **Age** | User's age is within resource's min/max range (or resource has no age restriction) |
| 5 | **Role** | Resource is "Both", OR matches user's role (Patient / Carer) |
| 6 | **Treatment Stage** | Resource is "All", OR matches user's selected stage |

## Scoring

Resources that pass all filters are ranked by **help type overlap score** — more matching categories = higher rank.

## Audit Trail

`matchResourcesWithLog()` returns a full `MatchLog`:

```typescript
interface MatchLog {
  timestamp: string;
  answers: Answers;
  totalResources: number;
  matchedCount: number;
  rejectedCount: number;
  matches: Array<{
    resourceId: string;
    resourceName: string;
    score: number;
    reasons: MatchReason[];  // per-filter reasoning
  }>;
  rejections: Array<{
    resourceId: string;
    resourceName: string;
    rejectedBy: string;   // which filter rejected it
    detail: string;       // why
  }>;
}
```

This log is stored in DynamoDB on the session via `POST /sessions/{id}/match-log`.

## Example Rejection

```json
{
  "resourceId": "29",
  "resourceName": "Bowel Cancer UK",
  "rejectedBy": "diagnosis",
  "detail": "Resource covers [Bowel Cancer] but user has Breast Cancer"
}
```
