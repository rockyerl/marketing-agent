#!/usr/bin/env node

/**
 * Sundawa Revenue Calculator & 10 Billion IDR Pacing Tracker
 * Usage: node marketing-engine/tools/revenue-calculator.js [--closed=<amount>]
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'revenue-plan-10b.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const args = process.argv.slice(2);
let currentClosedIDR = 0;

for (const arg of args) {
  if (arg.startsWith('--closed=')) {
    currentClosedIDR = Number(arg.split('=')[1]);
  }
}

const formatIDR = (num) => {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

console.log('================================================================');
console.log('         SUNDAWA MARKETING FLEET - 10 BILLION IDR ENGINE       ');
console.log('================================================================\n');

console.log(`[TARGET ANNUAL REVENUE] : ${formatIDR(config.targetAnnualRevenueIDR)}`);
console.log(`[MONTHLY PACING TARGET] : ${formatIDR(config.monthlyPacingTargetIDR)} / bulan`);
console.log(`[CURRENT CLOSED DEALS]  : ${formatIDR(currentClosedIDR)}`);

const remainingIDR = Math.max(0, config.targetAnnualRevenueIDR - currentClosedIDR);
const percentageDone = ((currentClosedIDR / config.targetAnnualRevenueIDR) * 100).toFixed(1);

console.log(`[PROGRESS ATTAINMENT]   : ${percentageDone}%`);
console.log(`[REMAINING GAP]         : ${formatIDR(remainingIDR)}\n`);

console.log('----------------------------------------------------------------');
console.log('               TERRITORY QUOTAS & UNIT ECONOMICS                ');
console.log('----------------------------------------------------------------');

for (const [key, t] of Object.entries(config.territoryQuotas)) {
  console.log(`* ${key.toUpperCase().padEnd(16)}: ${formatIDR(t.quotaIDR)} (${t.percentage}%)`);
  console.log(`  - Target Deals: ${t.dealsNeeded} deals | Avg Size: ${formatIDR(t.avgDealSizeIDR)}`);
  console.log(`  - Primary Focus: ${t.primaryFocus}`);
}

console.log('\n----------------------------------------------------------------');
console.log('             MONTHLY FUNNEL THROUGHPUT TO HIT TARGET            ');
console.log('----------------------------------------------------------------');

const f = config.funnelMetricsMonthly;
console.log(`  1. Global Prospects Sourced    : ${f.prospectsSourced.toLocaleString()} leads/mo`);
console.log(`  2. Contacted (Email + LinkedIn): ${f.emailsAndLinkedInDelivered.toLocaleString()} contacts/mo`);
console.log(`  3. Replies (est. ${(f.replyRateEstimated * 100).toFixed(0)}%)           : ${f.repliesMonthly} responses`);
console.log(`  4. Discovery Calls Booked      : ${f.qualifiedDiscoveryCalls} calls/mo`);
console.log(`  5. Proposals Submitted         : ${f.proposalsSubmitted} proposals/mo`);
console.log(`  6. Closed Won Deals (est. ${(f.closeRateOnProposals * 100).toFixed(0)}%) : ${f.closedDealsMonthly} deals/mo -> ${formatIDR(config.monthlyPacingTargetIDR)}/mo`);

console.log('\n================================================================');
console.log('  STATUS: READY FOR GLOBAL OUTREACH EXECUTION                   ');
console.log('================================================================');
