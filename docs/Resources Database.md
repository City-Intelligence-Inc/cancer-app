# Resources Database

## Current State (as of 2026-03-10)

- **32 total resources** — 23 from Google Sheet, 9 manually added
- **15 cities** in the system
- **Sheet and DB in sync** — 23 sheet rows match DB

## Resources by Source

### From Google Sheet (IDs 1-23)

| ID | Name | Cancer Type | Cities |
|----|------|------------|--------|
| 1 | Action On Pain | All | London |
| 2 | Breast Cancer Now | Breast | London |
| 3 | Lymphoedema Support Network | All | London |
| 4 | MLD UK | All | London |
| 5 | Pain Association Scotland | All | Edinburgh |
| 6 | Pain Concern | All | Edinburgh |
| 7 | PINNT | All | National |
| 8 | British Red Cross | All | London |
| 9 | Complete Care Shop | All | Online |
| 10 | Essential Aids | All | London |
| 11 | Living Made Easy | All | London |
| 12 | Carers Trust | All | London |
| 13 | Carers UK | All | London |
| 14 | National Assoc. of Funeral Directors | All | Solihull |
| 15 | Age UK | All | London |
| 16 | Assoc. of Independent Care Advisors | All | National |
| 17 | Citizens Advice | All | London |
| 18 | Disability Rights UK | All | London |
| 19 | Family Action | All | London |
| 20 | Macmillan Cancer Support | All | London |
| 21 | NHS 111 | All | National |
| 22 | NHS 24 | All | Edinburgh |
| 23 | SCOPE | All | London |

### Manually Added (IDs 24-32)

| ID | Name | Cancer Type | Cities |
|----|------|------------|--------|
| 24 | Maggie's Centres | All | London, Edinburgh, Manchester, Glasgow, Cardiff, Aberdeen, Dundee, Nottingham, Oxford |
| 25 | Teenage Cancer Trust | All (ages 13-24) | London, Manchester, Birmingham, Leeds, Edinburgh, Glasgow, Cardiff, Belfast, Southampton |
| 26 | Young Lives vs Cancer | All (ages 0-25) | London, Manchester, Birmingham, Leeds, Edinburgh, Glasgow, Bristol, Cardiff, Belfast |
| 27 | Trekstock | All (ages 20-45) | London |
| 28 | Cancer Support Scotland | All | Edinburgh, Glasgow, Aberdeen, Dundee |
| 29 | Bowel Cancer UK | Bowel Cancer | London, Edinburgh, Glasgow, Manchester, Birmingham, Cardiff, Belfast |
| 30 | Prostate Cancer UK | Prostate Cancer | London, Edinburgh, Glasgow, Manchester, Birmingham, Cardiff |
| 31 | Pancreatic Cancer UK | Pancreatic Cancer | London, Edinburgh, Glasgow, Manchester, Birmingham, Cardiff |
| 32 | Blood Cancer UK | Leukaemia, Lymphoma, Myeloma | London, Edinburgh |

## Cities in the System

Aberdeen, Belfast, Birmingham, Bristol, Cardiff, Dundee, Edinburgh, Glasgow, Leeds, London, Manchester, Nottingham, Oxford, Solihull, Southampton

## Admin Dashboard

View live sync status at the `/admin` page on the web app. Shows:
- Sheet row count vs DB count
- Which resources are in sync / missing
- Raw sheet data table
- DynamoDB data table
- "Sync Now" button
