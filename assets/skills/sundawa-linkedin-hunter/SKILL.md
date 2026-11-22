---
name: sundawa-linkedin-hunter
description: Autonomous LinkedIn and global B2B opportunity hunter. Finds high-ticket decision makers, monitors buying intent signals, and builds qualified lead lists across Indonesia, Europe, Australia, and the UK.
metadata: {"openclaw":{"skillKey":"sundawa-linkedin-hunter"}}
---

# Sundawa LinkedIn Hunter

Use this skill when the user wants an agent to hunt for high-value B2B opportunities on LinkedIn, build ICP-targeted prospect lists, extract buying signals (funding, hiring, international expansion), and feed qualified opportunities into the 10 Billion IDR sales pipeline.

## Trigger

```json
{
  "activation": {
    "anyPhrases": [
      "linkedin",
      "cari oportunity",
      "cari opportunity",
      "cari lead",
      "find leads",
      "prospecting",
      "scrape linkedin",
      "hunt opportunities"
    ]
  },
  "movement": {
    "target": "desk",
    "skipIfAlreadyThere": true
  }
}
```

When this skill is activated, the agent should return to its assigned desk before executing the prospecting search and data extraction workflow.

## Target Markets & ICP Definitions

This skill prioritizes high purchasing-power regions designed to hit the **Rp 10.000.000.000 (10 Miliar IDR)** annual revenue target for Sundawa Teknologi's custom software & system modernization services (sundawa.net):

1. **Indonesia (ID)**:
   - Targets: Enterprise, High-growth Tech, Logistics, Modern Retail, Manufacturing in Jakarta, Surabaya, Bandung.
   - Decision Makers: Direktur Utama / CEO, Chief Technology Officer (CTO), VP Engineering, Head of Digital Transformation.
   - Average Deal Size: Custom Project Rp 150.000.000 - Rp 500.000.000+ or Dedicated Squad Retainer Rp 35.000.000 - Rp 75.000.000/month.

2. **United Kingdom (UK)**:
   - Targets: Fintech, B2B SaaS, HealthTech, Digital Agencies in London, Manchester, Edinburgh.
   - Decision Makers: CEO, CTO, VP Engineering, Product Director.
   - Average Deal Size: Custom Deal £15,000 - £45,000 (~Rp 300M - Rp 900M).

3. **Europe (EU)**:
   - Targets: Tech scale-ups, Industrial AI & Software in DACH (Germany, Austria, Switzerland), Netherlands, Nordics.
   - Decision Makers: Founder, Managing Director (Geschäftsführer), Head of Software Development.
   - Average Deal Size: Custom Deal €20,000 - €60,000 (~Rp 350M - Rp 1.05 Miliar).

4. **Australia (AU)**:
   - Targets: Mid-market SaaS, High-growth Startups, Consultancies in Sydney, Melbourne, Brisbane.
   - Decision Makers: Founder, CTO, Operations Director, General Manager.
   - Average Deal Size: Custom Deal AUD $25,000 - $70,000 (~Rp 260M - Rp 735M).

## Buying Intent Triggers to Look For

- **Hiring Signal**: Companies with active job listings for Marketing, Sales, Engineering, or Expansion.
- **Capital Inflow**: Recent Seed, Series A, Series B funding within the last 6 months.
- **Geographic Expansion**: Companies announcing expansion into APAC, EMEA, or global markets.
- **Leadership Transition**: New CMO, VP Marketing, or CEO hired within the last 90 days.

## Storage Location

The authoritative opportunity and prospect store is:
`marketing-engine/data/prospects.json` or `sundawa-pipeline/leads.json` in the workspace root.

## Required Workflow

1. **Identify Territory & Vertical**: Read the request to determine if the target is Indonesia, UK, Europe, Australia, or Global.
2. **Formulate Search Query / Boolean Syntax**:
   - LinkedIn X-Ray pattern: `site:linkedin.com/in ("CEO" OR "Founder" OR "VP Marketing") "Location" "Industry" -intitle:jobs`
   - Sales Navigator Filters: Headcount (11-50, 51-200, 201-500), Geography, Posted in last 30 days.
3. **Extract & Verify Contact Info**:
   - Name, Title, Company Name, LinkedIn URL, Verified Work Email, Company Domain, Intent Trigger.
4. **Opportunity Scoring (1-100)**:
   - Budget Capacity (Company size & funding): 35 pts
   - Decision Maker Level (C-Level/VP): 30 pts
   - Intent Signal (Hiring / Scaling): 20 pts
   - Geographic Fit (ID, UK, EU, AU): 15 pts
   - Score >= 75 is marked `HOT_PROSPECT` and immediately routed to `sundawa-email-outreach`.
5. **Report Results**: Output a structured summary of discovered opportunities, deal valuation estimation, and next outreach step.
