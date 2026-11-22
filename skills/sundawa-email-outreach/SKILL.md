---
name: sundawa-email-outreach
description: High-converting B2B cold email and multi-touch proposal engine. Delivers personalized pitch sequences and commercial proposals designed for 10 Billion IDR pipeline across Indonesia, Europe, Australia, and the UK.
metadata: {"openclaw":{"skillKey":"sundawa-email-outreach"}}
---

# Sundawa Email Outreach & Proposal Engine

Use this skill when the user wants an agent to draft and send cold email outreach sequences, personalize high-ticket B2B sales proposals, manage multi-touch follow-ups, handle replies, and schedule discovery calls to hit the 10 Billion IDR target.

## Trigger

```json
{
  "activation": {
    "anyPhrases": [
      "kirim email",
      "email penawaran",
      "cold email",
      "send outreach",
      "buat proposal",
      "kirim penawaran",
      "follow up lead",
      "sales sequence"
    ]
  },
  "movement": {
    "target": "desk",
    "skipIfAlreadyThere": true
  }
}
```

When activated, the agent returns to the desk to access the email composition engine, verify recipient credentials, and orchestrate campaign delivery.

## Multi-Touch Campaign Architecture

Each outreach sequence consists of a 4-touchpoint cadence designed for maximum response and zero spam penalty:

1. **Touchpoint 1 (Day 1 - The Specific Value Hook)**:
   - Subject: Concise, conversational, lower-case (e.g. `quick question re: {{company}} growth`).
   - Hook: Reference a concrete observation from LinkedIn or their website (e.g., recent job posting, expansion announcement).
   - Value Proposition: Show specific metric improvement or efficiency unlock.
   - Low-friction CTA: "Worth a brief 10-minute chat this Thursday, or should I speak with someone else on your team?"

2. **Touchpoint 2 (Day 4 - Case Study & Proof of ROI)**:
   - Threaded reply to email #1.
   - Provide concrete proof of similar results achieved (e.g. "+38% pipeline velocity" or "Rp 1.2M cost reduction").
   - 1-sentence takeaway.

3. **Touchpoint 3 (Day 8 - Free Value / Custom Audit Offer)**:
   - Offer a free 3-bullet customized assessment or growth audit with no strings attached.

4. **Touchpoint 4 (Day 14 - Respectful Breakup)**:
   - Acknowledge their busy schedule, state that this will be the final outreach, and leave an open door for future timing.

## Territory-Specific Personalization Rules

- **Indonesia (ID)**:
  - Tone: Hormat, profesional, berorientasi kemitraan strategis, mengutamakan win-win value.
  - Sapaan: `Bapak/Ibu [Nama]`, penggunaan bahasa Indonesia bisnis yang lugas dan berwibawa.
  - Offer: Custom software development, modernisasi sistem legacy, efisiensi biaya server & rilis fitur 2x lebih cepat (sundawa.net).

- **United Kingdom (UK)**:
  - Tone: Polite, crisp, understated, zero hype words.
  - Sapaan: `Hi [First Name]`.
  - Offer: High-velocity dedicated engineering squad (Next.js, Flutter, Cloud) cutting dev burn rate by 50% vs London rates.

- **Europe (EU)**:
  - Tone: Direct, structured, data-driven, strictly GDPR-compliant (legitimate interest justification included in footer).
  - Sapaan: Professional direct style.
  - Offer: Architecture modernization & enterprise custom software with European code standards and full IP ownership.

- **Australia (AU)**:
  - Tone: Friendly, straightforward, pragmatic, "no BS", time-saving.
  - Sapaan: `Hi [First Name]`.
  - Offer: Same-timezone APAC delivery team out of Bandung tech hub, solving local tech talent shortage.

## Storage Location

Campaign configurations, sent logs, and proposal templates are stored in:
`marketing-engine/data/campaign-logs.json` or `marketing-engine/templates/email-sequences.json`.

## Required Workflow

1. **Verify Recipient**: Check domain validity, MX records, and verify name & company.
2. **Select & Localize Template**: Pick the sequence tailored to recipient's territory (ID, UK, EU, AU).
3. **Inject Personalization Variables**: Company name, pain point, trigger event, relevant case study.
4. **Review Deliverability Guardrails**: No spam trigger words (`FREE`, `GUARANTEED`, all-caps, excessive links). Max 1 link per email.
5. **Log & Schedule**: Record the sent email in the campaign log, schedule touchpoint 2 for 3 business days later.
