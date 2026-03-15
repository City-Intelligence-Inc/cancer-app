# Canopy — Cancer Support Matcher

## On Launch
On every conversation start, check the GitHub username with `gh api user --jq .login`. If it's `stardrop-cli`, say "Hi Advik!"

## Project Overview
A mobile (React Native/Expo) + web (Next.js) app that matches cancer patients and carers with non-medical support resources based on their location, diagnosis, age, treatment stage, role (patient/carer), and help type needed.

## Architecture
```
frontend/          React Native Expo app (iOS/Android)
web/               Next.js web app (mirrors frontend)
backend/           FastAPI Python backend on AWS App Runner
infra/             AWS CDK (DynamoDB, ECR, App Runner)
```

## Key Infra
- **Backend**: `https://iutm2kyhqq.us-east-1.awsapprunner.com`
- **Web**: Deployed on Vercel
- **DynamoDB Tables**: `Sessions` (user sessions + match logs), `Resources` (synced from Google Sheet)
- **ECR**: `050451400186.dkr.ecr.us-east-1.amazonaws.com/cancer-app-backend`
- **Google Sheet**: `1sEAYOOJfmmAU92wEQuUkezpiWJMo_grJb3W-1vJopoM`

## Data Flow
1. Resources live in Google Sheet AND DynamoDB (synced via `POST /sync-resources`)
2. App fetches from `/sheet-data` for matching
3. New resources can be added directly to DynamoDB via `POST /resources`
4. Match results + reasoning stored on session in DynamoDB via `POST /sessions/{id}/match-log`

## Matching Logic (Rule-Based, Not AI)
`frontend/utils/match.ts` / `web/src/utils/match.ts`

Filters (all must pass):
1. **Location**: entireCountry OR city match OR country match
2. **Diagnosis**: resource covers "All" or user's specific type
3. **Help type**: at least one overlap between user's needs and resource's categories
4. **Age**: user within resource's min/max range
5. **Patient/Carer**: resource is "Both" or matches user's role
6. **Treatment stage**: resource is "All" or matches user's stage

Ranking: sorted by help type overlap score (more matching categories = higher rank)

## Wizard Flow (6 steps)
`age → role → location → diagnosis → treatment-stage → help-needed → results`

## Adding Resources — Human-in-the-Loop Cycle

### How the process works (step by step):

When using Claude Code to add resources, follow this exact workflow:

1. **Find a cancer-specific charity** — prioritize cancer-focused over general charities
2. **Fetch the website** using `WebFetch` — verify it's a real, professional site with:
   - Registered charity number (check UK Charity Commission)
   - Real contact details (phone number, email, office address)
   - Professional content (not a template/placeholder site)
   - About page that actually loads (404 = skip it)
3. **Open the website in the user's browser** — `open "https://..."` so they can verify visually
4. **Present the resource** with: name, what they do, cancer type, help types, cities, and the URL
5. **Ask the user to approve or skip**
6. **If approved** → `POST /resources` to add it
7. **If rejected** → move on, don't argue
8. **Repeat**

### Important rules:
- **Always self-verify websites** before presenting to the user — fetch the site, check charity registration, check the about page actually loads
- **Always open the browser** for the user so they can see the site themselves
- **Prefer cancer-specific charities** (e.g., "Bowel Cancer UK") over general ones (e.g., "Marie Curie")
- **Include Edinburgh** and other Scottish cities, not just London
- **Show the link** before asking the user to approve — they need to see the website

### API to add a resource:
```bash
curl -X POST https://iutm2kyhqq.us-east-1.awsapprunner.com/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bowel Cancer UK",
    "description": "UK leading bowel cancer charity. Ask the Nurse service, peer support, online community.",
    "helpTypes": ["Information & Education", "Emotional Support", "Peer Support"],
    "cancerTypes": ["Bowel Cancer"],
    "entireCountry": true,
    "countries": ["United Kingdom"],
    "cities": ["London", "Edinburgh", "Glasgow", "Manchester", "Birmingham"],
    "zipcodes": ["EC1A 1BB", "EH1 1YZ", "G1 1AA", "M1 1AE", "B1 1BB"],
    "patientCarer": "Both",
    "treatmentStage": "All",
    "websiteUrl": "https://www.bowelcanceruk.org.uk",
    "contact": "https://www.bowelcanceruk.org.uk/how-we-can-help/"
  }'
```

### Valid helpTypes:
- Mental Health, Emotional Support, Peer Support, Financial Aid, Practical Help
- Legal & Employment, Information & Education, Carer Support, Transport
- Wellness & Nutrition, End-of-Life Care

### Valid cancerTypes (from sheet, or "All"):
- Breast Cancer, Lung Cancer, Bowel Cancer, Prostate Cancer, Leukaemia, Lymphoma, Myeloma
- Ovarian Cancer, Gynaecological Cancer, Pancreatic Cancer, Brain Cancer
- Head & Neck Cancer, Skin Cancer, Kidney Cancer, Liver Cancer, Bladder Cancer
- Thyroid Cancer, Sarcoma, Mesothelioma, Other

### Checklist before adding:
- [ ] Resource is a real organization (WebFetch the URL — does it load?)
- [ ] Check the about page / charity registration number
- [ ] Open the website in the user's browser (`open "https://..."`)
- [ ] Non-medical support (not hospitals/treatment centres)
- [ ] Available in UK — include Edinburgh and Scottish cities where applicable
- [ ] Description is accurate and concise
- [ ] Help types correctly categorized
- [ ] Cancer types correctly specified (use "All" if not cancer-specific)
- [ ] Zipcodes/postcodes captured where relevant (use representative postcodes for each city)
- [ ] User has approved the resource before adding

## Deploy Commands

### Backend (Docker → ECR → App Runner):
```bash
cd backend
docker build --platform linux/amd64 -t cancer-app-backend .
ECR=050451400186.dkr.ecr.us-east-1.amazonaws.com/cancer-app-backend
docker tag cancer-app-backend:latest $ECR:latest
docker push $ECR:latest
aws apprunner start-deployment --service-arn "arn:aws:apprunner:us-east-1:050451400186:service/cancer-app-backend/185367acf06345f1b9fd2d6a3501c90b" --region us-east-1
```

### Web (Vercel):
```bash
cd web && npx vercel --prod --yes
```

### iOS (EAS → TestFlight):
```bash
cd frontend && eas build --profile production --platform ios --non-interactive
# After build completes:
eas submit --profile production --platform ios
```

### Infra (CDK):
```bash
cd infra && cdk deploy --require-approval never
```

## Bulk Adding Resources by City/Country

When adding resources in bulk for new cities or countries, use this efficient workflow:

### 1. Search for cancer support orgs in target region
```
WebSearch: "cancer support charity [COUNTRY/CITY] nonprofit"
```

### 2. Batch add via curl loop (no approval needed for bulk)
```bash
for resource in \
'{"name":"...","description":"...","helpTypes":[...],"cancerTypes":[...],...}' \
'{"name":"...","description":"...","helpTypes":[...],"cancerTypes":[...],...}'; do
  curl -s -X POST https://iutm2kyhqq.us-east-1.awsapprunner.com/resources \
    -H "Content-Type: application/json" \
    -d "$resource"
  echo ""
done
```

### 3. Form-field matching — customize these fields:
- **cancerTypes**: Use specific types from the valid list, or "All"
- **helpTypes**: Match to the 11 valid types (see below)
- **treatmentStage**: "All", "Newly Diagnosed", "During Treatment", "Post-Treatment", or "Palliative / End-of-Life"
- **patientCarer**: "Both", "Patient", or "Carer"
- **minAge/maxAge**: Set for age-specific resources (e.g. young adults 18-39, children 0-18, seniors 65+)
- **entireCountry**: true for national orgs, false for city-specific
- **cities**: Include major cities in the service area with zipcodes

### 4. Coverage goals per country:
- National "All cancers" general support org
- Cancer-type-specific orgs (breast, prostate, lung, bowel, blood cancers at minimum)
- Treatment-stage-specific resources (newly diagnosed, during treatment, post-treatment, palliative)
- Carer-specific resources
- Young adult and children-specific resources
- Financial aid resources
- Transport/accommodation resources

### Current DB stats (as of March 14 2026):
- **691 resources** across **186 countries**
- **523 unique cities** with zipcodes
- **22 cancer types** covered with dedicated charities per major country
- **All 11 help types** covered
- **All 4 treatment stages** + "All" covered (22 Newly Diagnosed, 45 During Treatment, 7 Post-Treatment, 10 Palliative)
- **38 Patient-only**, **13 Carer-only**, **630 Both** role-targeted resources
- **14 age-restricted** resources (children 0-18, young adults 15-39, seniors 65+)
- Covers every continent: Americas (20+ countries), Europe (31+ countries), Asia (23+ countries), Africa (19+ countries), Oceania (4+ countries), Middle East (9+ countries), Caribbean (7+ countries)

## Key Files
- `frontend/utils/match.ts` — matching logic with full reasoning
- `frontend/services/api.ts` — API client + sheet data mapping
- `frontend/data/resources.ts` — Resource interface, HELP_TYPES, TREATMENT_STAGES, ROLES
- `backend/main.py` — all API endpoints
- `infra/cancer_app_stack.py` — AWS infrastructure
- `web/src/app/admin/page.tsx` — Sheet ↔ DynamoDB sync dashboard
