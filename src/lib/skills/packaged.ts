type PackagedSkillFile = {
  relativePath: string;
  content: string;
};

// Keep this string synchronized with assets/skills/todo-board/SKILL.md.
const TODO_BOARD_SKILL_MD = `---
name: todo
description: Maintain a shared workspace TODO list with blocked tasks.
metadata: {"openclaw":{"skillKey":"todo-board"}}
---

# TODO Board

Use this skill when the user wants to manage a shared task list for the current workspace.

## Trigger

\`\`\`json
{
  "activation": {
    "anyPhrases": [
      "todo",
      "todo list",
      "blocked task",
      "blocked tasks",
      "add to my todo",
      "show my todo"
    ]
  },
  "movement": {
    "target": "desk",
    "skipIfAlreadyThere": true
  }
}
\`\`\`

When this skill is activated, the agent should return to its assigned desk before handling the request.

- If the user asks from Telegram or any other external surface to add, block, unblock, remove, or read TODO items, treat that as a trigger for this skill.
- The physical behavior for this skill is: go sit at the assigned desk, then perform the TODO board workflow.
- If the agent is already at the desk, continue without adding extra movement narration.

## Storage location

The authoritative task file is \`todo-skill/todo-list.json\` in the workspace root.

- Always treat that file as the source of truth.
- Never rely on chat memory alone for the latest task state.
- Create the \`todo-skill\` directory and \`todo-list.json\` file if they do not exist.

## Required workflow

1. Read \`todo-skill/todo-list.json\` before answering any task-management request.
2. If the file does not exist, create it with the schema in this document before continuing.
3. After every add, remove, block, or unblock action, write the full updated JSON back to disk.
4. If the file exists but is invalid JSON or does not match the schema, repair it into a valid structure, preserve any recoverable items, and mention that repair in your response.
5. If the user request is ambiguous, ask a clarifying question instead of guessing.

## Supported actions

- Add a task.
  Create a new item unless an equivalent active item already exists.
- Block a task.
  Change the matching item to \`status: "blocked"\`. If the task does not exist and the request is clear, create it directly as blocked.
- Unblock a task.
  Change the matching item back to \`status: "todo"\` and clear \`blockReason\`.
- Remove a task.
  Delete only the matching item. If multiple items could match, ask for clarification.
- Read the list.
  Summarize tasks grouped into \`TODO\` and \`BLOCKED\`.

## File format

Use this JSON shape:

\`\`\`json
{
  "version": 1,
  "updatedAt": "2026-03-22T00:00:00.000Z",
  "items": [
    {
      "id": "task-1",
      "title": "Example task",
      "status": "todo",
      "createdAt": "2026-03-22T00:00:00.000Z",
      "updatedAt": "2026-03-22T00:00:00.000Z",
      "blockReason": null
    }
  ]
}
\`\`\`

## Field rules

- Keep \`version\` at \`1\`.
- Generate stable, human-readable IDs such as \`prepare-demo\` or \`task-2\`.
- Keep titles concise and preserve the user's intent.
- Use only \`todo\` or \`blocked\` for \`status\`.
- Use ISO timestamps for \`createdAt\`, item \`updatedAt\`, and top-level \`updatedAt\`.
- Keep \`blockReason\` as \`null\` unless the user gave a reason or a short precise reason is clearly implied.

## Mutation rules

- Avoid duplicate active items that describe the same work.
- Preserve existing IDs and \`createdAt\` values for unchanged items.
- Update the touched item's \`updatedAt\` whenever you modify it.
- Update the top-level \`updatedAt\` on every write.
- Keep untouched items in their original order unless there is a strong reason to reorder them.

## Response style

- After each mutation, say what changed.
- When showing the list, group tasks into \`TODO\` and \`BLOCKED\`.
- Include each blocked task's reason when one exists.
`;

// Keep this string synchronized with assets/skills/todo-board/todo-list.example.json.
const TODO_BOARD_EXAMPLE_JSON = `{
  "version": 1,
  "updatedAt": "2026-03-22T00:00:00.000Z",
  "items": [
    {
      "id": "draft-roadmap",
      "title": "Draft the TODO skill roadmap",
      "status": "todo",
      "createdAt": "2026-03-22T00:00:00.000Z",
      "updatedAt": "2026-03-22T00:00:00.000Z",
      "blockReason": null
    },
    {
      "id": "gateway-access",
      "title": "Confirm gateway install access",
      "status": "blocked",
      "createdAt": "2026-03-22T00:00:00.000Z",
      "updatedAt": "2026-03-22T00:00:00.000Z",
      "blockReason": "Waiting for gateway credentials"
    }
  ]
}
`;

// Keep this string synchronized with assets/skills/task-manager/SKILL.md.
const TASK_MANAGER_SKILL_MD = `---
name: task-manager
description: Capture actionable user requests as persistent tasks, update task status as work progresses, and keep a shared task store in sync. Use when a user asks an agent to do work, check progress, block a task, complete a task, or manage the Kanban board.
metadata: {"openclaw":{"skillKey":"task-manager"}}
---

# Task Manager

Use this skill for task capture and task lifecycle updates.

## Trigger

\`\`\`json
{
  "activation": {
    "anyPhrases": [
      "add a task",
      "create a task",
      "track this task",
      "task status",
      "mark this done",
      "block this task",
      "what tasks do we have"
    ]
  },
  "movement": {
    "target": "desk",
    "skipIfAlreadyThere": true
  }
}
\`\`\`

Also use this skill even when those exact phrases are absent if the latest user message is an actionable work request. If the user asks the agent to do something, that request must become a task before the agent proceeds.

## Storage location

The authoritative task file is:

- \`\${OPENCLAW_STATE_DIR}/claw3d/task-manager/tasks.json\` when \`OPENCLAW_STATE_DIR\` is set.
- \`~/.openclaw/claw3d/task-manager/tasks.json\` otherwise.

Always treat that file as the shared source of truth for the Kanban board.

## Required workflow

1. Read the task file before handling an actionable request.
2. If the file does not exist, create it with the schema in this document.
3. If the latest user message is actionable and no matching active task exists, create one immediately.
4. Before starting execution, ensure the task is \`todo\` or move it to \`in_progress\`.
5. If work cannot continue, set the task to \`blocked\` and record a short reason in \`notes\`.
6. When work is finished, set the task to \`done\`.
7. When work needs user review or confirmation, set the task to \`review\`.
8. After every mutation, write the full updated JSON back to disk.

## Matching rules

- Match first by \`externalThreadId\` when the request comes from a stable thread or conversation.
- Otherwise match by a concise normalized title that preserves user intent.
- Avoid creating duplicate active tasks for the same request.

## Task fields

Each task must include:

- \`id\`
- \`title\`
- \`description\`
- \`status\`
- \`source\`
- \`sourceEventId\`
- \`assignedAgentId\`
- \`createdAt\`
- \`updatedAt\`
- \`playbookJobId\`
- \`runId\`
- \`channel\`
- \`externalThreadId\`
- \`lastActivityAt\`
- \`notes\`
- \`isArchived\`
- \`isInferred\`
- \`history\`

## Status rules

- New actionable requests start as \`todo\` unless work has already begun.
- Move to \`in_progress\` when the agent is actively working.
- Move to \`blocked\` when progress depends on missing input, credentials, approvals, or failures.
- Move to \`review\` when the work is ready for inspection or handoff.
- Move to \`done\` only when the requested work is complete.

## File format

\`\`\`json
{
  "schemaVersion": 1,
  "updatedAt": "2026-03-30T00:00:00.000Z",
  "tasks": [
    {
      "id": "research-mtulsa-com",
      "title": "Research mtulsa.com",
      "description": "Review mtulsa.com and summarize the site, positioning, and improvement opportunities.",
      "status": "in_progress",
      "source": "claw3d_manual",
      "sourceEventId": null,
      "assignedAgentId": "main",
      "createdAt": "2026-03-30T00:00:00.000Z",
      "updatedAt": "2026-03-30T00:10:00.000Z",
      "playbookJobId": null,
      "runId": null,
      "channel": "telegram",
      "externalThreadId": "telegram:direct:6866695577",
      "lastActivityAt": "2026-03-30T00:10:00.000Z",
      "notes": [],
      "isArchived": false,
      "isInferred": false,
      "history": [
        {
          "at": "2026-03-30T00:00:00.000Z",
          "type": "created",
          "note": "Task created.",
          "fromStatus": null,
          "toStatus": "todo"
        },
        {
          "at": "2026-03-30T00:10:00.000Z",
          "type": "status_changed",
          "note": null,
          "fromStatus": "todo",
          "toStatus": "in_progress"
        }
      ]
    }
  ]
}
\`\`\`

## Response rules

- Briefly confirm which task was created or updated.
- If the request is ambiguous, ask a clarifying question instead of guessing.
- Do not claim work is complete without updating the task status.
`;

// Keep this string synchronized with assets/skills/task-manager/tasks.example.json.
const TASK_MANAGER_EXAMPLE_JSON = `{
  "schemaVersion": 1,
  "updatedAt": "2026-03-30T00:10:00.000Z",
  "tasks": [
    {
      "id": "research-mtulsa-com",
      "title": "Research mtulsa.com",
      "description": "Review mtulsa.com and summarize the site, positioning, and improvement opportunities.",
      "status": "in_progress",
      "source": "claw3d_manual",
      "sourceEventId": null,
      "assignedAgentId": "main",
      "createdAt": "2026-03-30T00:00:00.000Z",
      "updatedAt": "2026-03-30T00:10:00.000Z",
      "playbookJobId": null,
      "runId": null,
      "channel": "telegram",
      "externalThreadId": "telegram:direct:6866695577",
      "lastActivityAt": "2026-03-30T00:10:00.000Z",
      "notes": [],
      "isArchived": false,
      "isInferred": false,
      "history": [
        {
          "at": "2026-03-30T00:00:00.000Z",
          "type": "created",
          "note": "Task created.",
          "fromStatus": null,
          "toStatus": "todo"
        },
        {
          "at": "2026-03-30T00:10:00.000Z",
          "type": "status_changed",
          "note": null,
          "fromStatus": "todo",
          "toStatus": "in_progress"
        }
      ]
    }
  ]
}
`;

// Keep this string synchronized with assets/skills/soundclaw/SKILL.md.
const SOUNDCLAW_SKILL_MD = `---
name: soundclaw
description: Control Spotify playback, search music, and return shareable music links.
metadata: {"openclaw":{"skillKey":"soundclaw"}}
---

# SOUNDCLAW

Use this skill when the user wants an agent to search for music, play a song or playlist, control Spotify playback, or send back a shareable Spotify link on the same channel the request came from.

## Trigger

\`\`\`json
{
  "activation": {
    "anyPhrases": [
      "spotify",
      "play a song",
      "play this song",
      "play music",
      "play a playlist",
      "find a song",
      "queue this song",
      "music link"
    ]
  },
  "movement": {
    "target": "jukebox",
    "skipIfAlreadyThere": true
  }
}
\`\`\`

When this skill is activated, the agent should walk to the office jukebox before handling the request.

- Treat requests from Telegram or any other external surface as valid triggers when they ask for Spotify playback, search, queueing, or music-link sharing.
- The physical behavior for this skill is: go to the jukebox, perform the music-selection workflow, then report the result.
- If the agent is already at the jukebox, continue without adding extra movement narration.

## Channel behavior

- Reply on the same active channel or session that received the request.
- If playback cannot start but a matching track, album, or playlist is found, send back the best Spotify link instead of failing silently.
- If multiple matches are plausible, ask a clarifying question instead of guessing.

---

## OpenClaw Gateway Skill Contract

> This section is for developers implementing the backend skill handler in OpenClaw.
> The Claw3D UI handles authentication via Spotify PKCE OAuth in the browser.
> The gateway skill handles agent-driven requests via the \`soundclaw.*\` RPC namespace.

### Authentication model

The user authenticates directly in the browser (PKCE, no secret required).
The access token is stored in browser \`localStorage\` under the key \`soundclaw_token\`.

For **agent-driven** playback (e.g. "play Jazz for me"), the gateway skill should either:
- Use a server-side Spotify app token (Client Credentials) for search-only actions, or
- Instruct the agent to tell the user to use the jukebox panel for actual playback

### RPC methods the gateway skill should expose

\`\`\`ts
// Search for tracks. Returns a list of { name, artist, album, uri, spotifyUrl }.
soundclaw.search({ query: string }): SpotifySearchResult[]

// Get a shareable Spotify link for a query (for Telegram/chat replies).
soundclaw.getLink({ query: string }): { url: string; title: string }

// Report current playback state (reads from Spotify API).
soundclaw.playerStatus(): PlayerStatus | null

// Request playback of a URI (requires user to be authenticated in browser).
soundclaw.play({ uri: string }): { ok: boolean; message?: string }

// Pause / resume / skip.
soundclaw.pause(): void
soundclaw.resume(): void
soundclaw.next(): void
soundclaw.previous(): void
\`\`\`

### Agent workflow

1. Agent receives a music request ("play some jazz", "find this song", etc.)
2. Agent walks to the jukebox (\`movement.target: "jukebox"\`)
3. Agent calls \`soundclaw.search\` to find the best match
4. If the request came from a chat channel (Telegram, etc.): call \`soundclaw.getLink\` and reply with the link
5. If the request came from the office UI: call \`soundclaw.play\` to start playback
6. Agent reports back what was played or linked
`;

const SUNDAWA_LINKEDIN_HUNTER_SKILL_MD = `---
name: sundawa-linkedin-hunter
description: Autonomous LinkedIn and global B2B opportunity hunter. Finds high-ticket decision makers, monitors buying intent signals, and builds qualified lead lists across Indonesia, Europe, Australia, and the UK.
metadata: {"openclaw":{"skillKey":"sundawa-linkedin-hunter"}}
---

# Sundawa LinkedIn Hunter

Use this skill when the user wants an agent to hunt for high-value B2B opportunities on LinkedIn, build ICP-targeted prospect lists, extract buying signals (funding, hiring, international expansion), and feed qualified opportunities into the 10 Billion IDR sales pipeline.

## Trigger

\`\`\`json
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
\`\`\`

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
\`marketing-engine/data/prospects.json\` or \`sundawa-pipeline/leads.json\` in the workspace root.

## Required Workflow

1. **Identify Territory & Vertical**: Read the request to determine if the target is Indonesia, UK, Europe, Australia, or Global.
2. **Formulate Search Query / Boolean Syntax**:
   - LinkedIn X-Ray pattern: \`site:linkedin.com/in ("CEO" OR "Founder" OR "VP Marketing") "Location" "Industry" -intitle:jobs\`
   - Sales Navigator Filters: Headcount (11-50, 51-200, 201-500), Geography, Posted in last 30 days.
3. **Extract & Verify Contact Info**:
   - Name, Title, Company Name, LinkedIn URL, Verified Work Email, Company Domain, Intent Trigger.
4. **Opportunity Scoring (1-100)**:
   - Budget Capacity (Company size & funding): 35 pts
   - Decision Maker Level (C-Level/VP): 30 pts
   - Intent Signal (Hiring / Scaling): 20 pts
   - Geographic Fit (ID, UK, EU, AU): 15 pts
   - Score >= 75 is marked \`HOT_PROSPECT\` and immediately routed to \`sundawa-email-outreach\`.
5. **Report Results**: Output a structured summary of discovered opportunities, deal valuation estimation, and next outreach step.
`;

const SUNDAWA_LINKEDIN_HUNTER_EXAMPLE_JSON = `{
  "version": 1,
  "updatedAt": "2026-11-22T00:00:00.000Z",
  "territories": {
    "indonesia": {
      "name": "Indonesia",
      "currency": "IDR",
      "targetRevenueAnnual": 2500000000,
      "queries": [
        "site:linkedin.com/in (\\\\\\"CEO\\\\\\" OR \\\\\\"Founder\\\\\\" OR \\\\\\"VP Marketing\\\\\\" OR \\\\\\"Chief Commercial Officer\\\\\\") (\\\\\\"Jakarta\\\\\\" OR \\\\\\"Surabaya\\\\\\" OR \\\\\\"Bandung\\\\\\") (\\\\\\"B2B\\\\\\" OR \\\\\\"SaaS\\\\\\" OR \\\\\\"Tech\\\\\\")",
        "site:linkedin.com/in (\\\\\\"Head of Growth\\\\\\" OR \\\\\\"Direktur Komersial\\\\\\") Indonesia (\\\\\\"Retail\\\\\\" OR \\\\\\"Fintech\\\\\\" OR \\\\\\"Manufacturing\\\\\\")"
      ],
      "targetIndustries": ["Fintech", "SaaS", "Enterprise Tech", "High-growth E-commerce", "Industrial Manufacturing"],
      "avgDealSize": 250000000
    },
    "united_kingdom": {
      "name": "United Kingdom",
      "currency": "GBP",
      "targetRevenueAnnual": 2500000000,
      "queries": [
        "site:linkedin.com/in (\\\\\\"CEO\\\\\\" OR \\\\\\"Founder\\\\\\" OR \\\\\\"Managing Director\\\\\\" OR \\\\\\"VP Growth\\\\\\") (\\\\\\"London\\\\\\" OR \\\\\\"Manchester\\\\\\" OR \\\\\\"Bristol\\\\\\") (\\\\\\"Tech\\\\\\" OR \\\\\\"SaaS\\\\\\" OR \\\\\\"B2B\\\\\\")",
        "site:linkedin.com/in (\\\\\\"Chief Commercial Officer\\\\\\" OR \\\\\\"Head of Marketing\\\\\\") UK (\\\\\\"Scale-up\\\\\\" OR \\\\\\"Fintech\\\\\\" OR \\\\\\"AI\\\\\\")"
      ],
      "targetIndustries": ["Fintech", "B2B SaaS", "Professional Services", "AI & Analytics"],
      "avgDealSize": 500000000
    },
    "europe": {
      "name": "Europe (DACH & Benelux)",
      "currency": "EUR",
      "targetRevenueAnnual": 2500000000,
      "queries": [
        "site:linkedin.com/in (\\\\\\"Geschäftsführer\\\\\\" OR \\\\\\"Founder\\\\\\" OR \\\\\\"CEO\\\\\\" OR \\\\\\"Head of Growth\\\\\\") (\\\\\\"Germany\\\\\\" OR \\\\\\"Berlin\\\\\\" OR \\\\\\"Munich\\\\\\" OR \\\\\\"Zurich\\\\\\" OR \\\\\\"Amsterdam\\\\\\") (\\\\\\"Software\\\\\\" OR \\\\\\"B2B\\\\\\")",
        "site:linkedin.com/in (\\\\\\"VP Marketing\\\\\\" OR \\\\\\"Chief Marketing Officer\\\\\\") (\\\\\\"Netherlands\\\\\\" OR \\\\\\"Sweden\\\\\\" OR \\\\\\"France\\\\\\") (\\\\\\"SaaS\\\\\\" OR \\\\\\"Tech\\\\\\")"
      ],
      "targetIndustries": ["Industrial Tech", "B2B Software", "AI Automation", "HealthTech"],
      "avgDealSize": 500000000
    },
    "australia": {
      "name": "Australia",
      "currency": "AUD",
      "targetRevenueAnnual": 2500000000,
      "queries": [
        "site:linkedin.com/in (\\\\\\"CEO\\\\\\" OR \\\\\\"Founder\\\\\\" OR \\\\\\"Managing Director\\\\\\" OR \\\\\\"Head of Growth\\\\\\") (\\\\\\"Sydney\\\\\\" OR \\\\\\"Melbourne\\\\\\" OR \\\\\\"Brisbane\\\\\\") (\\\\\\"Tech\\\\\\" OR \\\\\\"SaaS\\\\\\")",
        "site:linkedin.com/in (\\\\\\"Marketing Director\\\\\\" OR \\\\\\"General Manager\\\\\\") Australia (\\\\\\"B2B\\\\\\" OR \\\\\\"E-commerce Scale-up\\\\\\")"
      ],
      "targetIndustries": ["B2B SaaS", "E-commerce Growth", "Mining & AgTech", "Digital Agencies"],
      "avgDealSize": 400000000
    }
  }
}`;

const SUNDAWA_EMAIL_OUTREACH_SKILL_MD = `---
name: sundawa-email-outreach
description: High-converting B2B cold email and multi-touch proposal engine. Delivers personalized pitch sequences and commercial proposals designed for 10 Billion IDR pipeline across Indonesia, Europe, Australia, and the UK.
metadata: {"openclaw":{"skillKey":"sundawa-email-outreach"}}
---

# Sundawa Email Outreach & Proposal Engine

Use this skill when the user wants an agent to draft and send cold email outreach sequences, personalize high-ticket B2B sales proposals, manage multi-touch follow-ups, handle replies, and schedule discovery calls to hit the 10 Billion IDR target.

## Trigger

\`\`\`json
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
\`\`\`

When activated, the agent returns to the desk to access the email composition engine, verify recipient credentials, and orchestrate campaign delivery.

## Multi-Touch Campaign Architecture

Each outreach sequence consists of a 4-touchpoint cadence designed for maximum response and zero spam penalty:

1. **Touchpoint 1 (Day 1 - The Specific Value Hook)**:
   - Subject: Concise, conversational, lower-case (e.g. \`quick question re: {{company}} growth\`).
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
  - Sapaan: \`Bapak/Ibu [Nama]\`, penggunaan bahasa Indonesia bisnis yang lugas dan berwibawa.
  - Offer: Custom software development, modernisasi sistem legacy, efisiensi biaya server & rilis fitur 2x lebih cepat (sundawa.net).

- **United Kingdom (UK)**:
  - Tone: Polite, crisp, understated, zero hype words.
  - Sapaan: \`Hi [First Name]\`.
  - Offer: High-velocity dedicated engineering squad (Next.js, Flutter, Cloud) cutting dev burn rate by 50% vs London rates.

- **Europe (EU)**:
  - Tone: Direct, structured, data-driven, strictly GDPR-compliant (legitimate interest justification included in footer).
  - Sapaan: Professional direct style.
  - Offer: Architecture modernization & enterprise custom software with European code standards and full IP ownership.

- **Australia (AU)**:
  - Tone: Friendly, straightforward, pragmatic, "no BS", time-saving.
  - Sapaan: \`Hi [First Name]\`.
  - Offer: Same-timezone APAC delivery team out of Bandung tech hub, solving local tech talent shortage.

## Storage Location

Campaign configurations, sent logs, and proposal templates are stored in:
\`marketing-engine/data/campaign-logs.json\` or \`marketing-engine/templates/email-sequences.json\`.

## Required Workflow

1. **Verify Recipient**: Check domain validity, MX records, and verify name & company.
2. **Select & Localize Template**: Pick the sequence tailored to recipient's territory (ID, UK, EU, AU).
3. **Inject Personalization Variables**: Company name, pain point, trigger event, relevant case study.
4. **Review Deliverability Guardrails**: No spam trigger words (\`FREE\`, \`GUARANTEED\`, all-caps, excessive links). Max 1 link per email.
5. **Log & Schedule**: Record the sent email in the campaign log, schedule touchpoint 2 for 3 business days later.
`;

const SUNDAWA_EMAIL_OUTREACH_EXAMPLE_JSON = `{
  "version": 1,
  "updatedAt": "2026-11-22T00:00:00.000Z",
  "sequences": {
    "indonesia": {
      "touchpoint1": {
        "subject": "Inisiatif efisiensi & akselerasi revenue {{company}}",
        "body": "Halo Pak/Bu {{lastName}},\\\\n\\\\nSaya mengamati perkembangan {{company}}, khususnya inisiatif {{triggerTopic}} yang baru saja diluncurkan.\\\\n\\\\nDi Sundawa, kami membantu perusahaan enterprise dan scale-up mengotomatisasi pipeline akuisisi dan operasional pertumbuhan sehingga mampu menekan CAC hingga 40% dan mengamankan kontrak bernilai tinggi lebih konsisten.\\\\n\\\\nApakah Bapak/Ibu ada waktu luang sekitar 15 menit di hari Kamis atau Jumat ini untuk diskusi santai mengenai strategi ini?\\\\n\\\\nSalam hormat,\\\\nTim Sundawa Marketing"
      },
      "touchpoint2": {
        "subject": "Re: Inisiatif efisiensi & akselerasi revenue {{company}}",
        "body": "Halo Pak/Bu {{lastName}},\\\\n\\\\nMelanjutkan email sebelumnya, saya ingin membagikan studi kasus singkat saat kami membantu klien B2B sejenis mencatatkan pipeline deal baru senilai Rp 2,8 Miliar dalam 90 hari pertama melalui sistem outbounds dan sales ops terintegrasi.\\\\n\\\\nSaya bisa kirimkan ringkasan 2 halaman studi kasusnya jika Bapak/Ibu berminat.\\\\n\\\\nSalam hangat,\\\\nTim Sundawa Marketing"
      }
    },
    "united_kingdom": {
      "touchpoint1": {
        "subject": "quick thought for {{company}}'s growth ops",
        "body": "Hi {{firstName}},\\\\n\\\\nNoticed {{company}} is actively expanding {{triggerTopic}} across the UK market.\\\\n\\\\nWe build autonomous revenue and client-acquisition engines that help high-growth firms identify qualified enterprise opportunities and cut operational overhead by 40-50%.\\\\n\\\\nWould you be open to a brief 10-minute exchange this Thursday to see if our execution model aligns with your Q1/Q2 roadmap?\\\\n\\\\nBest regards,\\\\nSundawa Global Client Team"
      }
    },
    "europe": {
      "touchpoint1": {
        "subject": "operational efficiency & pipeline acceleration for {{company}}",
        "body": "Hi {{firstName}},\\\\n\\\\nI came across {{company}}'s recent update regarding {{triggerTopic}} and wanted to reach out directly.\\\\n\\\\nOur team specializes in deploying automated B2B acquisition infrastructure that shortens deal cycles and scales outbound qualified pipeline with strict data protection compliance.\\\\n\\\\nCould we explore a quick 10-minute intro call this week to see whether this is relevant to your current priorities?\\\\n\\\\nKind regards,\\\\nSundawa European Growth Team"
      }
    },
    "australia": {
      "touchpoint1": {
        "subject": "{{company}} + scaling acquisition without headcount bloat",
        "body": "G'day {{firstName}},\\\\n\\\\nSaw {{company}}'s focus on scaling {{triggerTopic}} across APAC.\\\\n\\\\nWe partner with high-velocity companies in Sydney and Melbourne to deploy autonomous revenue workflows that deliver 3-4x pipeline velocity at a fraction of traditional agency cost.\\\\n\\\\nOpen to catching up for a quick 10-minute chat this Wednesday or Thursday?\\\\n\\\\nCheers,\\\\nSundawa Growth Team"
      }
    }
  }
}`;

const PACKAGED_SKILL_FILES: Record<string, PackagedSkillFile[]> = {
  "todo-board": [
    {
      relativePath: "SKILL.md",
      content: TODO_BOARD_SKILL_MD,
    },
    {
      relativePath: "todo-list.example.json",
      content: TODO_BOARD_EXAMPLE_JSON,
    },
  ],
  "task-manager": [
    {
      relativePath: "SKILL.md",
      content: TASK_MANAGER_SKILL_MD,
    },
    {
      relativePath: "tasks.example.json",
      content: TASK_MANAGER_EXAMPLE_JSON,
    },
  ],
  soundclaw: [
    {
      relativePath: "SKILL.md",
      content: SOUNDCLAW_SKILL_MD,
    },
  ],
  "sundawa-linkedin-hunter": [
    {
      relativePath: "SKILL.md",
      content: SUNDAWA_LINKEDIN_HUNTER_SKILL_MD,
    },
    {
      relativePath: "search-queries.example.json",
      content: SUNDAWA_LINKEDIN_HUNTER_EXAMPLE_JSON,
    },
  ],
  "sundawa-email-outreach": [
    {
      relativePath: "SKILL.md",
      content: SUNDAWA_EMAIL_OUTREACH_SKILL_MD,
    },
    {
      relativePath: "campaign-templates.example.json",
      content: SUNDAWA_EMAIL_OUTREACH_EXAMPLE_JSON,
    },
  ],
};

export const readPackagedSkillFiles = (
  packageId: string,
): PackagedSkillFile[] => {
  const files = PACKAGED_SKILL_FILES[packageId];
  if (!files || files.length === 0) {
    throw new Error(`Packaged skill assets are missing: ${packageId}`);
  }
  if (!files.some((file) => file.relativePath === "SKILL.md")) {
    throw new Error(`Packaged skill is missing SKILL.md: ${packageId}`);
  }
  return files.map((file) => ({ ...file }));
};
