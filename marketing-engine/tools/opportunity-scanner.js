#!/usr/bin/env node

/**
 * Sundawa Global Opportunity Scanner & Scoring Engine
 * Analyzes B2B leads from LinkedIn / Databases for high-ticket qualification
 */

const fs = require('fs');
const path = require('path');

const sampleLeadsPath = path.join(__dirname, '..', 'data', 'sample-pipeline.json');

const scoreLead = (lead) => {
  let score = 0;
  const breakdown = [];

  // 1. Geography fit (Max 20 pts)
  const priorityRegions = ['indonesia', 'united kingdom', 'europe', 'australia'];
  const region = (lead.country || '').toLowerCase();
  if (priorityRegions.some(r => region.includes(r))) {
    score += 20;
    breakdown.push('Priority Target Territory (+20)');
  } else {
    score += 10;
    breakdown.push('Secondary Global Territory (+10)');
  }

  // 2. Decision Maker Level (Max 30 pts)
  const title = (lead.title || '').toLowerCase();
  if (title.includes('ceo') || title.includes('founder') || title.includes('managing director') || title.includes('direktur utama')) {
    score += 30;
    breakdown.push('C-Level / Top Executive (+30)');
  } else if (title.includes('vp') || title.includes('director') || title.includes('head of')) {
    score += 25;
    breakdown.push('VP / Department Head (+25)');
  } else {
    score += 10;
    breakdown.push('Mid-management (+10)');
  }

  // 3. Company Headcount / Budget Capacity (Max 30 pts)
  const headcount = lead.headcount || 0;
  if (headcount >= 50 && headcount <= 500) {
    score += 30;
    breakdown.push('Sweet-spot scale-up / mid-market (+30)');
  } else if (headcount > 500) {
    score += 25;
    breakdown.push('Large Enterprise (+25)');
  } else if (headcount >= 15) {
    score += 20;
    breakdown.push('Early growth firm (+20)');
  } else {
    score += 10;
    breakdown.push('Micro firm (+10)');
  }

  // 4. Intent Signal (Max 20 pts)
  if (lead.hasFundingOrHiringTrigger) {
    score += 20;
    breakdown.push('Active Hiring / Capital Inflow Trigger (+20)');
  } else {
    score += 5;
    breakdown.push('Standard Profile (+5)');
  }

  let status = 'COLD';
  if (score >= 80) status = 'HOT_PRIORITY';
  else if (score >= 60) status = 'WARM_QUALIFIED';

  return { score, status, breakdown };
};

const runScanner = () => {
  console.log('================================================================');
  console.log('       SUNDAWA GLOBAL OPPORTUNITY SCANNER & SCORER              ');
  console.log('================================================================\n');

  if (!fs.existsSync(sampleLeadsPath)) {
    console.log('No pipeline data found at: ' + sampleLeadsPath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(sampleLeadsPath, 'utf8'));
  const leads = data.leads || [];

  console.log(`Processing ${leads.length} active leads in pipeline...\n`);

  for (const lead of leads) {
    const analysis = scoreLead(lead);
    console.log(`[${analysis.status.padEnd(14)}] ${lead.name} (${lead.title})`);
    console.log(`  Company : ${lead.company} (${lead.country})`);
    console.log(`  Score   : ${analysis.score}/100`);
    console.log(`  Est. Deal Size: Rp ${Number(lead.estimatedDealValueIDR).toLocaleString('id-ID')}`);
    console.log(`  Signals : ${analysis.breakdown.join(' | ')}`);
    console.log(`  Next Step: ${analysis.status === 'HOT_PRIORITY' ? 'Deploy Email Sequence #1 & LinkedIn Connection' : 'Nurture via Content'}\n`);
  }
};

runScanner();
