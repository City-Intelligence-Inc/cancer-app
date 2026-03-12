# Canopy — Cancer Support Matcher

A mobile + web app that matches cancer patients and carers with non-medical support resources.

## Quick Links

- [[Architecture]] — system overview, tech stack, infra
- [[Data Flow]] — how resources move from sheet to DB to user
- [[Matching Logic]] — the 6-filter rule-based matching system
- [[Wizard Flow]] — the 6-step user questionnaire
- [[Adding Resources]] — human-in-the-loop cycle for adding resources
- [[Deployment]] — how to deploy backend, web, iOS, infra
- [[Resources Database]] — current state of resources in the system
- [[API Reference]] — all backend endpoints

## Tech Stack

| Layer | Tech | Hosted |
|-------|------|--------|
| Mobile | React Native / Expo | TestFlight (iOS) |
| Web | Next.js (App Router) | Vercel |
| Backend | FastAPI (Python) | AWS App Runner |
| Database | DynamoDB | AWS |
| Infra | AWS CDK | CloudFormation |
| Data Source | Google Sheets | Google |
