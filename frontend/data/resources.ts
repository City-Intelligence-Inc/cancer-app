export interface Resource {
  id: string;
  name: string;
  description: string;
  helpTypes: string[];
  diagnoses: string[];
  ageRange: [number, number] | null;
  locations: string[];
  url: string;
  phone?: string;
}

export const HELP_TYPES = [
  "Financial Assistance",
  "Peer Support",
  "Transportation",
  "Mental Health",
  "Nutrition",
  "Legal Aid",
  "Childcare",
  "Workplace & Insurance",
] as const;

export const DIAGNOSES = [
  "Breast Cancer",
  "Lung Cancer",
  "Prostate Cancer",
  "Colorectal Cancer",
  "Leukemia / Lymphoma",
  "Skin Cancer",
  "Other / Unsure",
] as const;

export const resources: Resource[] = [
  {
    id: "cancercare",
    name: "CancerCare",
    description:
      "Free professional support services including counseling, support groups, educational workshops, and financial assistance.",
    helpTypes: ["Financial Assistance", "Mental Health", "Peer Support"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.cancercare.org",
    phone: "1-800-813-4673",
  },
  {
    id: "pan-foundation",
    name: "PAN Foundation",
    description:
      "Helps underinsured patients with out-of-pocket costs for prescribed medications and treatments.",
    helpTypes: ["Financial Assistance"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.panfoundation.org",
    phone: "1-866-316-7263",
  },
  {
    id: "healthwell",
    name: "HealthWell Foundation",
    description:
      "Provides financial assistance to cover coinsurance, copayments, healthcare premiums, and deductibles.",
    helpTypes: ["Financial Assistance"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.healthwellfoundation.org",
    phone: "1-800-675-8416",
  },
  {
    id: "csn",
    name: "Cancer Survivors Network",
    description:
      "Online community by the American Cancer Society connecting survivors and caregivers through shared experiences.",
    helpTypes: ["Peer Support"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://csn.cancer.org",
  },
  {
    id: "imerman-angels",
    name: "Imerman Angels",
    description:
      "Pairs cancer fighters and survivors one-on-one with someone who has fought the same type of cancer.",
    helpTypes: ["Peer Support", "Mental Health"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.imermanangels.org",
    phone: "1-866-463-7626",
  },
  {
    id: "road-to-recovery",
    name: "ACS Road to Recovery",
    description:
      "Provides free rides to and from cancer-related medical appointments through volunteer drivers.",
    helpTypes: ["Transportation"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.cancer.org/support-programs-and-services/road-to-recovery.html",
    phone: "1-800-227-2345",
  },
  {
    id: "cancer-support-community",
    name: "Cancer Support Community",
    description:
      "Provides free support groups, counseling, education, and healthy lifestyle programs.",
    helpTypes: ["Mental Health", "Peer Support", "Nutrition"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.cancersupportcommunity.org",
    phone: "1-888-793-9355",
  },
  {
    id: "livestrong",
    name: "LIVESTRONG Foundation",
    description:
      "Provides free cancer support services including emotional support, financial guidance, and fertility preservation.",
    helpTypes: ["Mental Health", "Financial Assistance"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.livestrong.org",
    phone: "1-855-220-7777",
  },
  {
    id: "komen",
    name: "Susan G. Komen",
    description:
      "Provides financial assistance, education, and support specifically for breast cancer patients.",
    helpTypes: ["Financial Assistance", "Peer Support"],
    diagnoses: ["Breast Cancer"],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.komen.org",
    phone: "1-877-465-6636",
  },
  {
    id: "lungevity",
    name: "LUNGevity Foundation",
    description:
      "Lung cancer focused research, education, and support including peer-to-peer mentoring.",
    helpTypes: ["Peer Support", "Mental Health"],
    diagnoses: ["Lung Cancer"],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.lungevity.org",
    phone: "1-844-360-5864",
  },
  {
    id: "pcf",
    name: "Prostate Cancer Foundation",
    description:
      "Provides information, support resources, and research funding for prostate cancer patients.",
    helpTypes: ["Peer Support", "Mental Health"],
    diagnoses: ["Prostate Cancer"],
    ageRange: [40, 120],
    locations: ["Nationwide"],
    url: "https://www.pcf.org",
    phone: "1-800-757-2873",
  },
  {
    id: "lls",
    name: "Leukemia & Lymphoma Society",
    description:
      "Financial support, co-pay assistance, and peer support for blood cancer patients.",
    helpTypes: ["Financial Assistance", "Peer Support"],
    diagnoses: ["Leukemia / Lymphoma"],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.lls.org",
    phone: "1-800-955-4572",
  },
  {
    id: "ccal",
    name: "Cancer and Careers",
    description:
      "Empowers and educates people with cancer to thrive in the workplace through expert advice and resources.",
    helpTypes: ["Workplace & Insurance", "Legal Aid"],
    diagnoses: [],
    ageRange: [18, 70],
    locations: ["Nationwide"],
    url: "https://www.cancerandcareers.org",
  },
  {
    id: "triage-cancer",
    name: "Triage Cancer",
    description:
      "Provides education on legal and practical issues of cancer including insurance, employment, and finances.",
    helpTypes: ["Legal Aid", "Workplace & Insurance", "Financial Assistance"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://triagecancer.org",
  },
  {
    id: "camp-kesem",
    name: "Camp Kesem",
    description:
      "Free summer camps for children ages 6-18 whose parents have or have had cancer.",
    helpTypes: ["Childcare"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.campkesem.org",
  },
  {
    id: "kids-konnected",
    name: "Kids Konnected",
    description:
      "Support groups and programs for children who have a parent with cancer.",
    helpTypes: ["Childcare", "Mental Health"],
    diagnoses: [],
    ageRange: null,
    locations: ["Nationwide"],
    url: "https://www.kidskonnected.org",
    phone: "1-800-899-2866",
  },
  {
    id: "meals-to-heal",
    name: "Meals to Heal / God's Love We Deliver",
    description:
      "Delivers nutritious meals to people too sick to shop or cook for themselves.",
    helpTypes: ["Nutrition"],
    diagnoses: [],
    ageRange: null,
    locations: ["New York", "Nationwide"],
    url: "https://www.glwd.org",
    phone: "1-212-294-8100",
  },
  {
    id: "stupid-cancer",
    name: "Stupid Cancer",
    description:
      "Support community specifically for adolescents and young adults (ages 15-39) affected by cancer.",
    helpTypes: ["Peer Support", "Mental Health"],
    diagnoses: [],
    ageRange: [15, 39],
    locations: ["Nationwide"],
    url: "https://stupidcancer.org",
  },
];
