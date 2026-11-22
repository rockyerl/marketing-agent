#!/usr/bin/env node

/**
 * Sundawa Marketing Fleet - Railway Production Runner
 * Starts the Gateway, Marketing Daily Runner, and the Next.js Production Server.
 */

const { fork, spawn } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log('      SUNDAWA MARKETING FLEET - RAILWAY PRODUCTION RUNNER       ');
console.log('================================================================\n');

// Ensure public host access works smoothly on Railway
if (!process.env.HOST) {
  process.env.HOST = '0.0.0.0';
}
if (!process.env.STUDIO_ACCESS_TOKEN && !process.env.ALLOW_PUBLIC_ACCESS) {
  process.env.ALLOW_PUBLIC_ACCESS = 'true';
}

const children = [];

const cleanExit = () => {
  console.log('\n[Railway Runner] Shutting down services cleanly...');
  children.forEach(child => {
    try {
      if (!child.killed) child.kill('SIGTERM');
    } catch {}
  });
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

async function start() {
  const rootDir = path.resolve(__dirname, '..');

  // 1. Start OpenClaw / Demo Gateway Adapter (Port 18789)
  const gatewayPath = path.join(rootDir, 'server', 'demo-gateway-adapter.js');
  console.log('[Railway Runner] 1/3 Starting OpenClaw Marketing Gateway on :18789...');
  
  const gatewayProcess = fork(gatewayPath, [], {
    cwd: rootDir,
    env: { ...process.env, DEMO_ADAPTER_PORT: '18789' },
    stdio: 'inherit'
  });
  children.push(gatewayProcess);

  gatewayProcess.on('exit', (code) => {
    console.error(`[Railway Runner] Gateway process exited with code ${code}`);
  });

  // Short pause to let gateway initialize port
  await new Promise(r => setTimeout(r, 1500));

  // 2. Start Autonomous Marketing Engine Daily Runner (Background Cron)
  const runnerPath = path.join(rootDir, 'marketing-engine', 'tools', 'daily-runner.js');
  console.log('[Railway Runner] 2/3 Starting Autonomous Marketing Daily Runner...');
  try {
    const dailyProcess = fork(runnerPath, [], {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    children.push(dailyProcess);

    dailyProcess.on('exit', (code) => {
      console.warn(`[Railway Runner] Daily runner exited with code ${code}`);
    });
  } catch (err) {
    console.warn('[Railway Runner] Could not start daily-runner:', err.message);
  }

  // 3. Start Next.js Custom Server
  const serverPath = path.join(rootDir, 'server', 'index.js');
  const port = process.env.PORT || '3000';
  console.log(`[Railway Runner] 3/3 Starting Next.js Production Web Server on port ${port}...`);

  const serverProcess = fork(serverPath, [], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: port,
      HOST: process.env.HOST || '0.0.0.0'
    },
    stdio: 'inherit'
  });
  children.push(serverProcess);

  serverProcess.on('exit', (code) => {
    console.error(`[Railway Runner] Web server exited with code ${code}`);
    cleanExit();
  });
}

start().catch(err => {
  console.error('[Railway Runner] Startup error:', err);
  process.exit(1);
});
