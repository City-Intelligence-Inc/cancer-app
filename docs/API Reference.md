# API Reference

Base URL: `https://iutm2kyhqq.us-east-1.awsapprunner.com`

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check — returns `{"status": "ok"}` |

## Sessions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create a new session (returns sessionId) |
| GET | `/sessions/{id}` | Get session by ID |
| PUT | `/sessions/{id}` | Update session answers |
| POST | `/sessions/{id}/match-log` | Store match results + reasoning on session |

### Session Update Fields

```json
{
  "age": 35,
  "location": "Edinburgh",
  "country": "United Kingdom",
  "diagnosis": "Breast Cancer",
  "help_needed": ["Emotional Support", "Peer Support"],
  "role": "Patient",
  "treatment_stage": "During Treatment"
}
```

## Resources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/resources` | Get all resources from DynamoDB |
| POST | `/resources` | Add a new resource (auto-increment ID) |

### Create Resource Body

```json
{
  "name": "Charity Name",
  "description": "What they do",
  "helpTypes": ["Emotional Support", "Peer Support"],
  "cancerTypes": ["Breast Cancer"],
  "entireCountry": true,
  "countries": ["United Kingdom"],
  "cities": ["London", "Edinburgh"],
  "minAge": null,
  "maxAge": null,
  "patientCarer": "Both",
  "treatmentStage": "All",
  "websiteUrl": "https://example.org",
  "contact": "phone or URL"
}
```

## Sheet Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sheet-data` | Raw Google Sheet data (headers + rows) |
| POST | `/sync-resources` | Sync all sheet rows into DynamoDB Resources table |
| GET | `/sync-status` | Live diff: sheet rows vs DynamoDB items |

### Sync Status Response

```json
{
  "sheetCount": 23,
  "dbCount": 32,
  "inSync": 23,
  "inSheetOnly": [],
  "inDbOnly": ["24", "25", "26"],
  "lastSynced": "2026-03-10T23:20:09.739798+00:00"
}
```
