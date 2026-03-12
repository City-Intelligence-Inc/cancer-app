# Adding Resources — Human-in-the-Loop

## The Process

When using Claude Code to add resources, follow this workflow:

1. **Find a cancer-specific charity** — prioritize cancer-focused over general charities
2. **Fetch the website** using `WebFetch` — verify it's real:
   - Registered charity number (check UK Charity Commission)
   - Real contact details (phone, email, office address)
   - Professional content (not a template/placeholder)
   - About page actually loads (404 = skip)
3. **Open the website** in the user's browser — `open "https://..."` so they verify visually
4. **Present the resource** with: name, what they do, cancer type, help types, cities, and URL
5. **Ask the user** to approve or skip
6. **If approved** → `POST /resources` to add it
7. **If rejected** → move on
8. **Repeat**

## Rules

- Always self-verify websites before presenting
- Always open the browser for the user
- Prefer cancer-specific charities over general ones
- Include Edinburgh and Scottish cities, not just London
- Show the link before asking to approve

## API

```bash
curl -X POST https://iutm2kyhqq.us-east-1.awsapprunner.com/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bowel Cancer UK",
    "description": "UK leading bowel cancer charity.",
    "helpTypes": ["Information & Education", "Emotional Support"],
    "cancerTypes": ["Bowel Cancer"],
    "entireCountry": true,
    "countries": ["United Kingdom"],
    "cities": ["London", "Edinburgh", "Glasgow"],
    "patientCarer": "Both",
    "treatmentStage": "All",
    "websiteUrl": "https://www.bowelcanceruk.org.uk",
    "contact": "https://www.bowelcanceruk.org.uk/support/"
  }'
```

## Valid Help Types

- Mental Health, Emotional Support, Peer Support, Financial Aid
- Practical Help, Legal & Employment, Information & Education
- Carer Support, Transport, Wellness & Nutrition, End-of-Life Care

## Valid Cancer Types

Use `"All"` if not cancer-specific. Otherwise:

- Breast Cancer, Lung Cancer, Bowel Cancer, Prostate Cancer
- Leukaemia, Lymphoma, Myeloma, Ovarian Cancer
- Gynaecological Cancer, Pancreatic Cancer, Brain Cancer
- Head & Neck Cancer, Skin Cancer, Kidney Cancer
- Liver Cancer, Bladder Cancer, Thyroid Cancer
- Sarcoma, Mesothelioma, Other

## Checklist Before Adding

- [ ] WebFetch the URL — does it load?
- [ ] Check charity registration number
- [ ] Open in user's browser (`open "https://..."`)
- [ ] Non-medical support (not hospitals/treatment centres)
- [ ] Available in UK — include Scottish cities where applicable
- [ ] Description accurate and concise
- [ ] Help types correctly categorized
- [ ] Cancer types correctly specified
- [ ] User approved before adding
