// start-wrapper.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

function log(message) {
  console.log(`[startup] ${message}`);
}

function errorLog(message, err = null) {
  console.error(`[startup ERROR] ${message}`);
  if (err) console.error(err);
}

async function waitForServer(url, timeout = 90000, interval = 3000) {
  const start = Date.now();
  log(`Waiting for Directus to respond at ${url} (timeout: ${timeout/1000}s)`);

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/server/ping`);
      if (res.ok) {
        log('Directus ping successful – server is ready');
        return true;
      }
    } catch (err) {
      // silent retry – no need to spam logs on every failed attempt
    }
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error(`Directus did not become ready within ${timeout/1000} seconds`);
}

async function main() {
  try {
    log('Starting Directus bootstrap process...');

    // 1. Bootstrap (creates DB tables if needed)
    log('Running: npx directus bootstrap');
    await execAsync('npx directus bootstrap');
    log('Bootstrap completed');

    // 2. Apply schema snapshot
    // log('Applying schema snapshot from ./snapshot.yaml');
    // await execAsync('npx directus schema apply ./snapshot.yaml --yes');
    // log('Schema applied successfully');

    // 3. Start Directus server in background
    log('Starting Directus server in background...');
    const directusProcess = exec('npx directus start');

    // Forward server logs to Render console
    directusProcess.stdout?.on('data', (data) => process.stdout.write(data));
    directusProcess.stderr?.on('data', (data) => process.stderr.write(data));

    directusProcess.on('error', (err) => {
      errorLog('Directus process failed to start', err);
    });

    directusProcess.on('exit', (code, signal) => {
      log(`Directus process exited with code ${code} (signal: ${signal})`);
      if (code !== 0) process.exit(code || 1);
    });

    // 4. Wait until local API is responding
    await waitForServer('http://localhost:8055');

    // 5. Apply configuration sync (push local dump to running instance)
//     log('Starting configuration sync (directus-sync push)...');

//     const directusUrl = process.env.DIRECTUS_URL || process.env.PUBLIC_URL;
//     const directusToken = process.env.DIRECTUS_TOKEN;

//     if (!directusUrl) {
//       throw new Error('Missing DIRECTUS_URL or PUBLIC_URL environment variable');
//     }
//     if (!directusToken) {
//       throw new Error('Missing DIRECTUS_TOKEN environment variable – cannot sync configuration');
//     }

//     log(`Using Directus URL: ${directusUrl}`);
//     log(`Token is present (length: ${directusToken.length})`);

//     const syncCommand = `npx directus-sync push --directus-url "${directusUrl}" --directus-token "${directusToken}"`;

//     log(`Executing: ${syncCommand.replace(directusToken, '***')}`); // hide token in logs

//     await execAsync(syncCommand, { stdio: 'inherit' });
//     log('Configuration sync completed successfully');

//     log('Startup complete – Directus should now be fully ready');
//     log(`Admin panel: ${directusUrl}/admin`);

  } catch (error) {
    errorLog('Startup sequence failed', error);
    process.exit(1);
  }
}

main();